"use server";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
  CVData,
  CVProfile,
  Education,
  Project,
  SkillCategory,
  WorkExperience,
} from "@/src/types/cv";
import { sanitizeRichText } from "@/src/utils/richText";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "cv-data.json");
const AUTH_FILE = path.join(DATA_DIR, "auth-config.json");

// 24h token TTL — short enough to force regular re-auth, long enough for UX
const JWT_TTL_MS = 24 * 60 * 60 * 1000;

/** Current PBKDF2 work factor (OWASP guidance for HMAC-SHA512). */
const PBKDF2_ITERATIONS = 210_000;
/** Work factor used by hashes created before the hardening pass. */
const LEGACY_PBKDF2_ITERATIONS = 10_000;
/** Bootstrap password that every deployment should replace on first login. */
const DEFAULT_PASSWORD = "admin123";
const MIN_PASSWORD_LENGTH = 12;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Secret used to sign JWTs. Supplied via AUTH_JWT_SECRET (>= 32 chars) so
 * tokens survive restarts and are shared if the app is ever scaled. In
 * development an ephemeral secret is generated per process; production fails
 * closed. Resolved lazily so `next build` does not require the runtime secret.
 */
let cachedJwtSecret: string | null = null;
function jwtSecret(): string {
  if (cachedJwtSecret) return cachedJwtSecret;
  const fromEnv = process.env.AUTH_JWT_SECRET;
  if (fromEnv) {
    if (fromEnv.length < 32) {
      throw new Error("AUTH_JWT_SECRET must be at least 32 characters long");
    }
    cachedJwtSecret = fromEnv;
    return cachedJwtSecret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_JWT_SECRET is required in production (>= 32 characters)");
  }
  console.warn(
    "[auth] AUTH_JWT_SECRET is not set — using an ephemeral development secret; tokens will not survive a restart.",
  );
  cachedJwtSecret = crypto.randomBytes(32).toString("base64");
  return cachedJwtSecret;
}

function hashPassword(
  password: string,
  salt: string,
  iterations: number = PBKDF2_ITERATIONS,
): string {
  return crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
}

/**
 * Constant-time string comparison. Both sides are hashed first so mismatched
 * lengths cannot short-circuit through `timingSafeEqual`.
 */
function safeEqual(a: string, b: string): boolean {
  const digestA = crypto.createHash("sha256").update(a).digest();
  const digestB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

/**
 * JWT-based auth: the token itself is a signed compact JSON.
 * No sessions.json on disk — the token carries username+exp and is verified
 * with the secret key on every request. This is stateless and container‑friendly.
 */
function signJwt(payload: Record<string, unknown>): string {
  const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
  const payloadStr = JSON.stringify(payload);
  const headerB64 = Buffer.from(header).toString("base64url");
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");
  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = crypto
    .createHmac("sha256", jwtSecret())
    .update(signingInput)
    .digest("base64url");
  return `${signingInput}.${signature}`;
}

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const headerB64 = parts[0];
    const payloadB64 = parts[1];
    const sigB64 = parts[2];

    // Re-compute signature and compare — simple HMAC check
    const header = Buffer.from(headerB64, "base64url").toString("utf-8");
    const payload = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const signingInput = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto.createHmac("sha256", jwtSecret()).update(signingInput).digest("base64url");

    if (!safeEqual(sigB64, expectedSig)) return null;

    // Very light payload parse: { sub, iat, exp }
    const parsed = JSON.parse(payload);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

interface AuthConfig {
  hash: string;
  salt: string;
  username: string;
  /** PBKDF2 work factor for `hash`; absent on configs created before 2026. */
  iterations?: number;
  /** Bumped whenever credentials change, revoking outstanding JWTs. */
  tokenVersion?: number;
}

function authConfigIterations(config: AuthConfig): number {
  return typeof config.iterations === "number" ? config.iterations : LEGACY_PBKDF2_ITERATIONS;
}

function authConfigTokenVersion(config: AuthConfig): number {
  return typeof config.tokenVersion === "number" ? config.tokenVersion : 0;
}

function getAuthConfig(): AuthConfig {
  if (fs.existsSync(AUTH_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
    } catch {}
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(DEFAULT_PASSWORD, salt);
  const config: AuthConfig = {
    username: "admin",
    salt,
    hash,
    iterations: PBKDF2_ITERATIONS,
    tokenVersion: 0,
  };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(config, null, 2), "utf-8");
  return config;
}

/**
 * `data/cv-data.json` is the single source of truth for CV content.
 * It must exist and be valid JSON with the CVData shape — there is no code
 * fallback seed. If the file is missing or corrupt, fail loudly instead of
 * silently overwriting it with template data.
 */
function readCVData(): CVData {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`CV data file missing: ${DATA_FILE}. Restore it from backup or recreate it.`);
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as CVData;
  } catch (error) {
    throw new Error(
      `CV data file unreadable or invalid JSON at ${DATA_FILE}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function saveCVData(data: CVData): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Rich-text fields are rendered with dangerouslySetInnerHTML, so every inbound
 * string is sanitized here before it can reach disk. This is the trust
 * boundary: the client editor is not trusted.
 */
const RICH_TEXT_FIELDS = ["summary", "description", "tagline"] as const;

/**
 * Sanitize only the rich-text-bearing fields of a record, leaving ids,
 * booleans, URLs and other scalars untouched.
 */
function sanitizeRichFields<T extends Record<string, any>>(record: T): T {
  const next: Record<string, any> = { ...record };
  for (const field of RICH_TEXT_FIELDS) {
    if (typeof next[field] === "string") next[field] = sanitizeRichText(next[field]);
  }
  /**
   * Headline is authored as plain text in a single-line input and rendered via
   * a React text node (client-side escaping), never rich HTML. So markup is
   * stripped outright — including legacy `<p>` wrappers — rather than
   * sanitized as rich text (which would re-wrap the value in `<p>`).
   */
  if (typeof next.headline === "string") {
    next.headline = next.headline
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (Array.isArray(next.highlights)) {
    next.highlights = next.highlights
      .map((item: unknown) => (typeof item === "string" ? sanitizeRichText(item) : item))
      .filter((item: unknown) => typeof item !== "string" || item.trim() !== "");
  }
  return next as T;
}

/**
 * Verify a JWT token: decode, check signature, and ensure it hasn't expired.
 * Returns { valid, payload } if valid, otherwise { valid: false }.
 *
 * `iat` is written in *seconds* (standard JWT convention) while the TTL and
 * `Date.now()` are in milliseconds — convert before comparing.
 */
function verifyJwt(token: string): { valid: boolean; payload?: Record<string, unknown> } {
  if (!token) return { valid: false };
  const parsed = parseJwt(token);
  if (!parsed) return { valid: false };
  const issuedAtMs = Number(parsed.iat) * 1000;
  if (!Number.isFinite(issuedAtMs)) return { valid: false };
  const now = Date.now();
  // Reject tokens "from the future" beyond a small clock-skew allowance.
  if (issuedAtMs - now > 60 * 1000) return { valid: false };
  if (now - issuedAtMs > JWT_TTL_MS) return { valid: false };
  // Revocation: tokens from before the last credential change are rejected.
  const tokenVersion = Number(parsed.ver ?? 0);
  if (!Number.isInteger(tokenVersion) || tokenVersion !== authConfigTokenVersion(getAuthConfig())) {
    return { valid: false };
  }
  return { valid: true, payload: parsed as Record<string, unknown> };
}

/** Extract the username from a verified JWT payload, or return null. */
function jwtUsername(payload: Record<string, unknown>): string | null {
  const sub = payload.sub;
  return typeof sub === "string" ? sub : null;
}

/** CV data source of truth — read from data/cv-data.json. */
export async function getCVDataAction(): Promise<CVData> {
  return readCVData();
}

/** Login → issue a JWT instead of a session token. */
export async function loginAction(
  username: string,
  pass: string,
): Promise<{ token: string; user: { username: string }; mustChangePassword: boolean }> {
  const authConfig = getAuthConfig();
  const iterations = authConfigIterations(authConfig);

  // Hash unconditionally so a wrong username costs the same as a wrong password
  // (prevents timing-based username enumeration).
  const hash = hashPassword(pass, authConfig.salt, iterations);
  const usernameOk = safeEqual(username, authConfig.username);
  const passwordOk = safeEqual(hash, authConfig.hash);
  if (!usernameOk || !passwordOk) {
    throw new Error("Invalid credentials");
  }

  // Transparently upgrade hashes created with the old work factor.
  if (iterations < PBKDF2_ITERATIONS) {
    const upgraded: AuthConfig = {
      ...authConfig,
      hash: hashPassword(pass, authConfig.salt),
      iterations: PBKDF2_ITERATIONS,
      tokenVersion: authConfigTokenVersion(authConfig),
    };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(upgraded, null, 2), "utf-8");
  }

  // Editing stays locked until the bootstrap password is replaced.
  const mustChangePassword = safeEqual(
    hash,
    hashPassword(DEFAULT_PASSWORD, authConfig.salt, iterations),
  );

  const payload = {
    sub: authConfig.username,
    ver: authConfigTokenVersion(authConfig),
    mustChange: mustChangePassword,
    iat: Math.floor(Date.now() / 1000),
  };
  const token = signJwt(payload);
  return {
    token,
    user: { username: authConfig.username },
    mustChangePassword,
  };
}

/** Verify JWT and return true/false (replaces verifySession / verifyAuthAction). */
export async function verifyAuthAction(token?: string | null): Promise<boolean> {
  const result = verifyJwt(token ?? "");
  return result.valid;
}

/**
 * Change password — requires a valid JWT.
 * Decode the payload to get the username for the auth check.
 */
export async function changePasswordAction(
  token: string,
  currentPass: string,
  newPass: string,
): Promise<{ success: boolean; message: string }> {
  const jwt = verifyJwt(token);
  if (!jwt.valid) {
    throw new Error("Unauthorized");
  }
  if (!newPass || newPass.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (newPass === DEFAULT_PASSWORD) {
    throw new Error("New password must not be the default password");
  }
  const authConfig = getAuthConfig();
  const currentHash = hashPassword(currentPass, authConfig.salt, authConfigIterations(authConfig));
  if (!safeEqual(currentHash, authConfig.hash)) {
    throw new Error("Current password incorrect");
  }
  const newSalt = crypto.randomBytes(16).toString("hex");
  const newHash = hashPassword(newPass, newSalt);
  const updated: AuthConfig = {
    username: authConfig.username,
    salt: newSalt,
    hash: newHash,
    iterations: PBKDF2_ITERATIONS,
    // Revoke every token issued with the old credentials.
    tokenVersion: authConfigTokenVersion(authConfig) + 1,
  };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(updated, null, 2), "utf-8");
  return { success: true, message: "Password updated. Please sign in again." };
}

/** Stateless JWT logout — JWTs carry an expiry, so the client simply discards the token. */
export async function logoutAction(token: string): Promise<void> {
  // No server-side revocation needed; the token's expiry (iat+24h) governs validity.
  // The client should remove the cookie/local token store.
  return;
}

/**
 * Generic CRUD factory for the array-valued CV collections
 * (experiences, education, skillCategories, projects).
 *
 * Each collection gets create/update/delete from one implementation, so auth
 * checks, sanitization, id generation, and error labels stay identical
 * everywhere. `insertAt === "top"` preserves the legacy
 * experiences/projects ordering (newest first).
 *
 * Per-collection `normalize` hooks keep only genuinely entity-specific bits
 * (default fields the older actions used to back-fill inline).
 */
function newEntityId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

/**
 * Gate for content mutations: a valid, unexpired token from a session that is
 * allowed to edit. Tokens minted while the default password is still in force
 * may only be used to change the password.
 */
function verifyEditorJwt(token: string): void {
  const jwt = verifyJwt(token);
  if (!jwt.valid) throw new Error("Unauthorized");
  if (jwt.payload?.mustChange) {
    throw new Error("Change the default admin password before editing content");
  }
}

interface CollectionConfig<T extends { id: string }> {
  idPrefix: string;
  /** New entries go to the front (used by experiences & projects). */
  insertAtTop?: boolean;
  key: "experiences" | "education" | "skillCategories" | "projects";
  label: string;
  normalize?: (entry: T) => T;
}

function collectionRepositories<T extends { id: string }>(config: CollectionConfig<T>) {
  const getCollection = (cv: CVData): T[] => cv[config.key] as unknown as T[];

  function create(token: string, input: Omit<T, "id">): T {
    verifyEditorJwt(token);
    const cv = readCVData();
    const entry = config.normalize
      ? config.normalize({ ...input, id: newEntityId(config.idPrefix) } as T)
      : ({ ...input, id: newEntityId(config.idPrefix) } as T);
    const list = getCollection(cv);
    if (config.insertAtTop) list.unshift(entry);
    else list.push(entry);
    saveCVData(cv);
    return entry;
  }

  function update(token: string, id: string, updates: Partial<T>): T {
    verifyEditorJwt(token);
    const cv = readCVData();
    const list = getCollection(cv);
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`${config.label} not found`);
    list[idx] = { ...list[idx], ...updates };
    saveCVData(cv);
    return list[idx];
  }

  function remove(token: string, id: string): void {
    verifyEditorJwt(token);
    const cv = readCVData();
    const list = getCollection(cv);
    cv[config.key] = list.filter((e) => e.id !== id) as never;
    saveCVData(cv);
  }

  return { create, update, remove };
}

const experienceRepo = collectionRepositories<WorkExperience>({
  key: "experiences",
  label: "Experience",
  idPrefix: "exp",
  insertAtTop: true,
  normalize: (entry) => ({
    ...entry,
    highlights: entry.highlights || [],
    technologies: entry.technologies || [],
  }),
});

const educationRepo = collectionRepositories<Education>({
  key: "education",
  label: "Education",
  idPrefix: "edu",
  normalize: (entry) => ({ ...entry, highlights: entry.highlights || [] }),
});

const skillCategoryRepo = collectionRepositories<SkillCategory>({
  key: "skillCategories",
  label: "Skill category",
  idPrefix: "sk",
  normalize: (entry) => ({ ...entry, skills: entry.skills || [] }),
});

const projectRepo = collectionRepositories<Project>({
  key: "projects",
  label: "Project",
  idPrefix: "proj",
  insertAtTop: true,
  normalize: (entry) => ({
    ...entry,
    technologies: entry.technologies || [],
    highlights: entry.highlights || [],
    featured: Boolean(entry.featured),
  }),
});

export async function createExperienceAction(
  token: string,
  exp: Omit<WorkExperience, "id">,
): Promise<WorkExperience> {
  return experienceRepo.create(token, sanitizeRichFields(exp) as Omit<WorkExperience, "id">);
}

export async function updateExperienceAction(
  token: string,
  id: string,
  updates: Partial<WorkExperience>,
): Promise<WorkExperience> {
  return experienceRepo.update(token, id, sanitizeRichFields(updates));
}

export async function deleteExperienceAction(token: string, id: string): Promise<void> {
  return experienceRepo.remove(token, id);
}

export async function createEducationAction(
  token: string,
  edu: Omit<Education, "id">,
): Promise<Education> {
  return educationRepo.create(token, sanitizeRichFields(edu) as Omit<Education, "id">);
}

export async function updateEducationAction(
  token: string,
  id: string,
  updates: Partial<Education>,
): Promise<Education> {
  return educationRepo.update(token, id, sanitizeRichFields(updates));
}

export async function deleteEducationAction(token: string, id: string): Promise<void> {
  return educationRepo.remove(token, id);
}

export async function createSkillCategoryAction(
  token: string,
  cat: Omit<SkillCategory, "id">,
): Promise<SkillCategory> {
  return skillCategoryRepo.create(token, cat);
}

export async function updateSkillCategoryAction(
  token: string,
  id: string,
  updates: Partial<SkillCategory>,
): Promise<SkillCategory> {
  return skillCategoryRepo.update(token, id, updates);
}

export async function deleteSkillCategoryAction(token: string, id: string): Promise<void> {
  return skillCategoryRepo.remove(token, id);
}

export async function createProjectAction(
  token: string,
  proj: Omit<Project, "id">,
): Promise<Project> {
  return projectRepo.create(token, sanitizeRichFields(proj) as Omit<Project, "id">);
}

export async function updateProjectAction(
  token: string,
  id: string,
  updates: Partial<Project>,
): Promise<Project> {
  return projectRepo.update(token, id, sanitizeRichFields(updates));
}

export async function deleteProjectAction(token: string, id: string): Promise<void> {
  return projectRepo.remove(token, id);
}

export async function updateProfileAction(token: string, profile: CVProfile): Promise<CVProfile> {
  verifyEditorJwt(token);
  if (!profile.name) throw new Error("Name is required");
  const cv = readCVData();
  cv.profile = { ...cv.profile, ...sanitizeRichFields(profile) };
  saveCVData(cv);
  return cv.profile;
}