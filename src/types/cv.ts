export interface MetricItem {
  context: string;
  id: string;
  label: string;
  value: string;
}

export interface CVProfile {
  availableForHire: boolean;
  avatarUrl: string;
  email: string;
  github: string;
  headline: string;
  linkedin: string;
  location: string;
  metrics: MetricItem[];
  name: string;
  phone: string;
  statusText: string;
  summary: string;
  title: string;
  website: string;
}

export interface WorkExperience {
  company: string;
  current: boolean;
  endDate: string;
  highlights: string[];
  id: string;
  location: string;
  role: string;
  startDate: string;
  summary: string;
  technologies: string[];
  type: string;
}

export interface Education {
  degree: string;
  endYear: string;
  field: string;
  highlights?: string[];
  honors?: string;
  id: string;
  institution: string;
  location: string;
  /** Uploaded logo (data URL) or the resolved fallback from `public/img/education/`. */
  logo?: string;
  startYear: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: Array<{
    name: string;
    level?: string;
    featured?: boolean;
    /** Resolved at read time from `public/img/skills/<slug>.<ext>`. */
    icon?: string;
    /** Uploaded logo (data URL); when set it wins over the resolved icon. */
    logo?: string;
  }>;
}

export interface Project {
  demoUrl?: string;
  description: string;
  featured: boolean;
  githubUrl?: string;
  highlights: string[];
  id: string;
  role: string;
  tagline: string;
  technologies: string[];
  title: string;
  year: string;
}

export interface PortfolioItem {
  description: string;
  id: string;
  /** Image URLs or paths under `public/`, shown as a gallery. */
  images: string[];
  link?: string;
  tagline: string;
  technologies: string[];
  title: string;
  year: string;
}

export interface CVData {
  education: Education[];
  experiences: WorkExperience[];
  portfolio: PortfolioItem[];
  profile: CVProfile;
  projects: Project[];
  skillCategories: SkillCategory[];
}

export type ModalType =
  | "profile"
  | "experience"
  | "education"
  | "skillCategory"
  | "project"
  | "portfolio"
  | null;