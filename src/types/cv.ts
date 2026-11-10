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
  startYear: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: Array<{
    name: string;
    level?: string;
    featured?: boolean;
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

export interface CVData {
  education: Education[];
  experiences: WorkExperience[];
  profile: CVProfile;
  projects: Project[];
  skillCategories: SkillCategory[];
}

export type ModalType = "profile" | "experience" | "education" | "skillCategory" | "project" | null;