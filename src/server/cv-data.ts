import fs from "node:fs";
import path from "node:path";
import type { CVData } from "@/src/types/cv";

/**
 * Reads `data/cv-data.json` and resolves the images that live on disk.
 *
 * Kept out of `actions.ts` so the read-only static export can prerender the CV
 * at build time without pulling in the `"use server"` module.
 */
const DATA_FILE = path.join(process.cwd(), "data", "cv-data.json");

/** Portfolio images live in one folder per item id: `public/img/portfolio/<id>/`. */
const PORTFOLIO_IMAGE_ROOT = path.join(process.cwd(), "public", "img", "portfolio");

/** Files the gallery understands; anything else in the folder is ignored. */
const IMAGE_EXTENSIONS = new Set([
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
 * admin controls the gallery order with `01-`, `02-` prefixes. When the folder
 * has no images, fall back to the item's stored URLs that still resolve; an
 * empty list means the UI shows its logo placeholder.
 */
function portfolioImagesFromFolder(id: string, stored: string[]): string[] {
  try {
    const files = fs
      .readdirSync(path.join(PORTFOLIO_IMAGE_ROOT, id))
      .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (files.length > 0) return files.map((file) => `/img/portfolio/${id}/${file}`);
  } catch {
    // Folder absent: use the stored URLs below.
  }

  return stored.filter(
    (src) =>
      /^(?:https?:\/\/|data:image\/)/i.test(src) ||
      (src.startsWith("/") && fs.existsSync(path.join(process.cwd(), "public", src))),
  );
}

/** Skill and education logos live in `public/img/<kind>/<slug>.<ext>`. */
const SKILL_ICON_ROOT = path.join(process.cwd(), "public", "img", "skills");
const EDUCATION_LOGO_ROOT = path.join(process.cwd(), "public", "img", "education");

/** Lowercase, drop `(...)` qualifiers, collapse everything else to dashes. */
function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Resolve an asset by filename slug in a `public/img/...` folder. Returns
 * `undefined` so the UI can pick its own placeholder.
 */
function findLogo(root: string, publicPath: string, name: string): string | undefined {
  const slug = slugifyName(name);
  if (!slug) return undefined;
  for (const extension of IMAGE_EXTENSIONS) {
    if (fs.existsSync(path.join(root, slug + extension))) {
      return `${publicPath}/${slug}${extension}`;
    }
  }
  return undefined;
}

function findSkillIcon(name: string): string | undefined {
  return findLogo(SKILL_ICON_ROOT, "/img/skills", name);
}

function findEducationLogo(institution: string): string | undefined {
  return findLogo(EDUCATION_LOGO_ROOT, "/img/education", institution);
}

export function readCVData(): CVData {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`CV data file missing: ${DATA_FILE}. Restore it from backup or recreate it.`);
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw) as CVData;
    return {
      ...data,
      education: (data.education ?? []).map((entry) => ({
        ...entry,
        logo: entry.logo || findEducationLogo(entry.institution),
      })),
      skillCategories: (data.skillCategories ?? []).map((category) => ({
        ...category,
        skills: (category.skills ?? []).map((skill) => ({
          ...skill,
          icon: skill.logo || findSkillIcon(skill.name),
        })),
      })),
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
