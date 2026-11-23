import { CVClient } from "@/src/components/CVClient";
import { readCVData } from "@/src/server/cv-data";
import type { CVData } from "@/src/types/cv";

/**
 * Static build of the CV. Copied over `src/app/page.tsx` by
 * `scripts/build-github-pages.sh`; there is no server at runtime, so the data
 * is prerendered here at build time.
 */
const basePath = process.env.STATIC_BASE_PATH || "";

/** Local assets live under the Pages base path; data URLs and http(s) are absolute. */
const asset = (src: string | undefined) => (src?.startsWith("/") ? basePath + src : src);

export default function Page() {
  const data = readCVData();
  const initialData: CVData = {
    ...data,
    profile: { ...data.profile, avatarUrl: asset(data.profile.avatarUrl) ?? "" },
    education: data.education.map((entry) => ({ ...entry, logo: asset(entry.logo) })),
    skillCategories: data.skillCategories.map((category) => ({
      ...category,
      skills: category.skills.map((skill) => ({
        ...skill,
        icon: asset(skill.icon),
        logo: asset(skill.logo),
      })),
    })),
    portfolio: data.portfolio.map((item) => ({
      ...item,
      images: item.images.map((src) => asset(src) ?? src),
    })),
  };

  return <CVClient initialData={initialData} />;
}
