"use server";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  countUsers,
  createFirstUser,
  findUserByUsername,
  hasUserDatabase,
  updateUserPassword,
} from "@/src/server/user-db";
import type {
  CVData,
  CVProfile,
  Education,
  PortfolioItem,
  Project,
  SkillCategory,
  WorkExperience,
} from "@/src/types/cv";
import { sanitizeRichText } from "@/src/utils/richText";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "cv-data.json");
const AUTH_FILE = path.join(DATA_DIR, "auth-config.json");

/**
 * Create `data/` on demand. Never do this at module scope: serverless hosts (Netlify/Vercel) load route modules
 * with a read-only CWD, and a top-level mkdir would crash the function before any handler can return an error.
 */
function ensureDataDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 24h token TTL — short enough to force regular re-auth, long enough for UX
const JWT_TTL_MS = 24 * 60 * 60 * 1000;

/** Current PBKDF2 work factor (OWASP guidance for HMAC-SHA512). */
const PBKDF2_ITERATIONS = 210_000;

/** Work factor used by hashes created before the hardening pass. */
const LEGACY_PBKDF2_ITERATIONS = 10_000;

/** Bootstrap password that every deployment should replace on first login. */
const DEFAULT_PASSWORD = "admin123";
const MIN_PASSWORD_LENGTH = 12;

/** Registration usernames: 3-32 chars, letters/numbers/._- only. */
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

/**
 * Secret used to sign JWTs. Supplied via AUTH_JWT_SECRET (>= 32 chars) so tokens survive restarts and are shared
 * if the app is ever scaled. In development an ephemeral secret is generated per process; production fails
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

    const header = Buffer.from(headerB64, "base64url").toString("utf-8");
    const payload = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const signingInput = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto
      .createHmac("sha256", jwtSecret())
      .update(signingInput)
      .digest("base64url");

    if (!safeEqual(sigB64, expectedSig)) return null;

    const parsed = JSON.parse(payload);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

interface AuthConfig {
  hash: string;
  /** PBKDF2 work factor for `hash`; absent on configs created before 2026. */
  iterations?: number;
  salt: string;
  /** Bumped whenever credentials change, revoking outstanding JWTs. */
  tokenVersion?: number;
  username: string;
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
  ensureDataDir();
  fs.writeFileSync(AUTH_FILE, JSON.stringify(config, null, 2), "utf-8");
  return config;
}

/** Normalized credential record shared by the Postgres and legacy stores. */
interface UserRecord {
  hash: string;
  iterations: number;
  salt: string;
  tokenVersion: number;
  username: string;
}

function legacyUserRecord(config: AuthConfig): UserRecord {
  return {
    username: config.username,
    salt: config.salt,
    hash: config.hash,
    iterations: authConfigIterations(config),
    tokenVersion: authConfigTokenVersion(config),
  };
}

/**
 * Resolve a user by name. With `DATABASE_URL` set the Postgres store is the
 * only source of truth; otherwise the legacy JSON admin file is used.
 */
async function findUser(username: string): Promise<UserRecord | null> {
  if (hasUserDatabase()) {
    try {
      return await findUserByUsername(username);
    } catch (err) {
      console.warn(
        "[auth] Postgres lookup failed, falling back to JSON file:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  return legacyUserRecord(getAuthConfig());
}

/** Persist a credential change for the active store. */
async function updateUserCredentials(
  user: UserRecord,
  next: { hash: string; iterations: number; salt: string; tokenVersion: number },
): Promise<void> {
  if (hasUserDatabase()) {
    try {
      await updateUserPassword(user.username, next);
      return;
    } catch (err) {
      console.warn(
        "[auth] Postgres write failed, falling back to JSON file:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  const config: AuthConfig = {
    username: user.username,
    salt: next.salt,
    hash: next.hash,
    iterations: next.iterations,
    tokenVersion: next.tokenVersion,
  };
  ensureDataDir();
  fs.writeFileSync(AUTH_FILE, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * `data/cv-data.json` is the single source of truth for CV content.
 * It must exist and be valid JSON with the CVData shape — there is no code
 * fallback seed. If the file is missing or corrupt, fail loudly instead of
 * silently overwriting it with template data.
 */
/** Portfolio images live in one folder per item id: `public/img/portfolio/<id>/`. */
const PORTFOLIO_IMAGE_ROOT = path.join(process.cwd(), "public", "img", "portfolio");

/** Files the gallery understands; anything else in the folder is ignored. */
const PORTFOLIO_IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".jxl",
  ".png",
  ".svg",
  ".webp",
]);

/**
 * List a portfolio item's images from its id folder, sorted by filename so the
 * admin controls the gallery order with `01-`, `02-` prefixes. Stored URLs are
 * the fallback when the folder is missing or unreadable (e.g. a serverless
 * bundle that only ships the committed files).
 */
function portfolioImagesFromFolder(id: string, stored: string[]): string[] {
  try {
    const files = fs
      .readdirSync(path.join(PORTFOLIO_IMAGE_ROOT, id))
      .filter((file) => PORTFOLIO_IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (files.length > 0) return files.map((file) => `/img/portfolio/${id}/${file}`);
  } catch {
    // Folder absent: fall back to the URLs stored in cv-data.json.
  }
  return stored;
}

function readCVData(): CVData {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`CV data file missing: ${DATA_FILE}. Restore it from backup or recreate it.`);
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw) as CVData;
    return {
      ...data,
      portfolio: (data.portfolio ?? []).map((item) => ({
        ...item,
        images: portfolioImagesFromFolder(item.id, item.images ?? []),
      })),
    };
  } catch (error) {
    throw new Error(
      `CV data file unreadable or invalid JSON at ${DATA_FILE}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function saveCVData(data: CVData): void {
  ensureDataDir();
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
 * Verify a JWT token: decode, check signature, ensure it hasn't expired, and
 * confirm the user still exists with the same credential version.
 *
 * `iat` is written in *seconds* (standard JWT convention) while the TTL and
 * `Date.now()` are in milliseconds — convert before comparing.
 */
async function verifyJwt(
  token: string,
): Promise<{ valid: boolean; payload?: Record<string, unknown> }> {
  if (!token) return { valid: false };
  const parsed = parseJwt(token);
  if (!parsed) return { valid: false };
  const issuedAtMs = Number(parsed.iat) * 1000;
  if (!Number.isFinite(issuedAtMs)) return { valid: false };
  const now = Date.now();
  // Reject tokens "from the future" beyond a small clock-skew allowance.
  if (issuedAtMs - now > 60 * 1000) return { valid: false };
  if (now - issuedAtMs > JWT_TTL_MS) return { valid: false };

  const sub = parsed.sub;
  if (typeof sub !== "string") return { valid: false };
  const user = await findUser(sub);
  if (!user) return { valid: false };

  // Revocation: tokens from before the last credential change are rejected.
  const tokenVersion = Number(parsed.ver ?? 0);
  if (!Number.isInteger(tokenVersion) || tokenVersion !== user.tokenVersion) {
    return { valid: false };
  }
  return { valid: true, payload: parsed as Record<string, unknown> };
}

/** CV data source of truth — read from data/cv-data.json. */
export async function getCVDataAction(): Promise<CVData> {
  return readCVData();
}

/** Bootstrap username created in the Postgres store when it is empty. */
const DEFAULT_USERNAME = "admin";

/**
 * Seed the bootstrap admin in Postgres when the store is empty.
 *
 * This must happen before any login or registration can claim the first
 * account: the default `admin / admin123` exists from the start, so the public
 * registration endpoint can never be used to take over the deployment.
 * `createFirstUser` is atomic, so concurrent requests cannot double-seed.
 */
async function ensureDefaultDbAdmin(): Promise<void> {
  if (!hasUserDatabase()) return;
  if ((await countUsers()) > 0) return;
  const salt = crypto.randomBytes(16).toString("hex");
  await createFirstUser({
    username: DEFAULT_USERNAME,
    salt,
    hash: hashPassword(DEFAULT_PASSWORD, salt),
    iterations: PBKDF2_ITERATIONS,
    tokenVersion: 0,
  });
}

/** Login → issue a JWT instead of a session token. */
export async function loginAction(
  username: string,
  pass: string,
): Promise<{ token: string; user: { username: string }; mustChangePassword: boolean }> {
  try {
    await ensureDefaultDbAdmin();
  } catch {
    // Postgres unavailable — fall back to JSON auth file
  }
  const user = await findUser(username);
  const iterations = user?.iterations ?? PBKDF2_ITERATIONS;
  // Hash unconditionally so a missing username costs the same as a wrong
  // password (prevents timing-based username enumeration).
  const hash = hashPassword(pass, user?.salt ?? "invalid-salt", iterations);
  const usernameOk = safeEqual(username, user?.username ?? "");
  const passwordOk = user ? safeEqual(hash, user.hash) : false;
  if (!user || !usernameOk || !passwordOk) {
    throw new Error("Invalid credentials");
  }

  // Transparently upgrade hashes created with the old work factor.
  if (iterations < PBKDF2_ITERATIONS) {
    await updateUserCredentials(user, {
      salt: user.salt,
      hash: hashPassword(pass, user.salt),
      iterations: PBKDF2_ITERATIONS,
      tokenVersion: user.tokenVersion,
    });
  }

  // The bootstrap password keeps editing locked until it is replaced. Only the
  // seeded admin can have it: registration and password changes reject it.
  const mustChangePassword = safeEqual(hash, hashPassword(DEFAULT_PASSWORD, user.salt, iterations));

  const payload = {
    sub: user.username,
    ver: user.tokenVersion,
    mustChange: mustChangePassword,
    iat: Math.floor(Date.now() / 1000),
  };
  const token = signJwt(payload);
  return {
    token,
    user: { username: user.username },
    mustChangePassword,
  };
}

/** Verify JWT and return true/false (replaces verifySession / verifyAuthAction). */
export async function verifyAuthAction(token?: string | null): Promise<boolean> {
  const result = await verifyJwt(token ?? "");
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
  const jwt = await verifyJwt(token);
  const username = jwt.payload?.sub;
  if (!jwt.valid || typeof username !== "string") {
    throw new Error("Unauthorized");
  }
  if (!newPass || newPass.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (newPass === DEFAULT_PASSWORD) {
    throw new Error("New password must not be the default password");
  }
  const user = await findUser(username);
  if (!user) throw new Error("Unauthorized");
  const currentHash = hashPassword(currentPass, user.salt, user.iterations);
  if (!safeEqual(currentHash, user.hash)) {
    throw new Error("Current password incorrect");
  }
  const newSalt = crypto.randomBytes(16).toString("hex");
  await updateUserCredentials(user, {
    salt: newSalt,
    hash: hashPassword(newPass, newSalt),
    iterations: PBKDF2_ITERATIONS,
    // Revoke every token issued with the old credentials.
    tokenVersion: user.tokenVersion + 1,
  });
  return { success: true, message: "Password updated. Please sign in again." };
}

/**
 * Public registration is closed: the Postgres store is seeded with the
 * bootstrap admin, so there is never a free first slot to claim.
 */
export async function registrationStatusAction(): Promise<{
  dbConfigured: boolean;
  open: boolean;
}> {
  return { dbConfigured: hasUserDatabase(), open: false };
}

/**
 * Registration is permanently closed. The endpoint is kept for URL
 * compatibility; seeding the bootstrap admin makes `createFirstUser` fail.
 */
export async function registerAction(
  username: string,
  pass: string,
): Promise<{ token: string; user: { username: string }; mustChangePassword: boolean }> {
  if (!hasUserDatabase()) {
    throw new Error("Registration requires DATABASE_URL to be configured");
  }
  try {
    await ensureDefaultDbAdmin();
  } catch {
    // Postgres unavailable — registration cannot proceed
    throw new Error("Database is not available for registration");
  }
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error(
      "Username must be 3-32 characters using letters, numbers, dot, dash, or underscore",
    );
  }
  if (!pass || pass.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (pass === DEFAULT_PASSWORD) {
    throw new Error("Choose a password other than the default");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const created = await createFirstUser({
    username,
    salt,
    hash: hashPassword(pass, salt),
    iterations: PBKDF2_ITERATIONS,
    tokenVersion: 0,
  });
  if (!created) {
    throw new Error("Registration is closed");
  }

  const token = signJwt({
    sub: created.username,
    ver: created.tokenVersion,
    mustChange: false,
    iat: Math.floor(Date.now() / 1000),
  });
  return { token, user: { username: created.username }, mustChangePassword: false };
}

/** Stateless JWT logout — JWTs carry an expiry, so the client simply discards the token. */
export async function logoutAction(token: string): Promise<void> {
  return;
}

/**
 * Generic CRUD factory for the array-valued CV collections (experiences, education, skillCategories, projects).
 *
 * Each collection gets create/update/delete from one implementation, so auth checks, sanitization, id generation,
 * and error labels stay identical everywhere. `insertAt === "top"` preserves the legacy
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
async function verifyEditorJwt(token: string): Promise<void> {
  const jwt = await verifyJwt(token);
  if (!jwt.valid) throw new Error("Unauthorized");
  if (jwt.payload?.mustChange) {
    throw new Error("Change the default admin password before editing content");
  }
}

interface CollectionConfig<T extends { id: string }> {
  idPrefix: string;
  insertAtTop?: boolean;
  key: "experiences" | "education" | "skillCategories" | "projects" | "portfolio";
  label: string;
  normalize?: (entry: T) => T;
}

function collectionRepositories<T extends { id: string }>(config: CollectionConfig<T>) {
  const getCollection = (cv: CVData): T[] => cv[config.key] as unknown as T[];

  async function create(token: string, input: Omit<T, "id">): Promise<T> {
    await verifyEditorJwt(token);
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

  async function update(token: string, id: string, updates: Partial<T>): Promise<T> {
    await verifyEditorJwt(token);
    const cv = readCVData();
    const list = getCollection(cv);
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`${config.label} not found`);
    list[idx] = { ...list[idx], ...updates };
    saveCVData(cv);
    return list[idx];
  }

  async function remove(token: string, id: string): Promise<void> {
    await verifyEditorJwt(token);
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

/** Only allow local paths, HTTP(S), and inline images as gallery sources. */
const IMAGE_SOURCE_PATTERN = /^(?:\/|https?:\/\/|data:image\/)/i;

function normalizeImageSources(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((image): image is string => typeof image === "string")
    .map((image) => image.trim())
    .filter((image) => image !== "" && IMAGE_SOURCE_PATTERN.test(image));
}

const portfolioRepo = collectionRepositories<PortfolioItem>({
  key: "portfolio",
  label: "Portfolio item",
  idPrefix: "folio",
  insertAtTop: true,
  normalize: (entry) => ({
    ...entry,
    images: normalizeImageSources(entry.images),
    technologies: entry.technologies || [],
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

export async function createPortfolioItemAction(
  token: string,
  item: Omit<PortfolioItem, "id">,
): Promise<PortfolioItem> {
  return portfolioRepo.create(token, sanitizeRichFields(item) as Omit<PortfolioItem, "id">);
}

export async function updatePortfolioItemAction(
  token: string,
  id: string,
  updates: Partial<PortfolioItem>,
): Promise<PortfolioItem> {
  const normalized = sanitizeRichFields(updates);
  if (normalized.images !== undefined) {
    normalized.images = normalizeImageSources(normalized.images);
  }
  return portfolioRepo.update(token, id, normalized);
}

export async function deletePortfolioItemAction(token: string, id: string): Promise<void> {
  return portfolioRepo.remove(token, id);
}

export async function updateProfileAction(token: string, profile: CVProfile): Promise<CVProfile> {
  await verifyEditorJwt(token);
  if (!profile.name) throw new Error("Name is required");
  const cv = readCVData();
  cv.profile = { ...cv.profile, ...sanitizeRichFields(profile) };
  saveCVData(cv);
  return cv.profile;
}