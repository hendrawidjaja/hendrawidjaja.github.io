export const IconSize = "h-4 w-4";

export const WORDING = {
  FULLNAME: "Hendra Widjaja",
  EDIT_CV: "Edit CV",
  BACK_TO_TOP: "Back to Top",
  CHANGE_PASSWORD: "Change Password",
};

export const MENU = [
  { href: "#experience", text: "Experience" },
  { href: "#education", text: "Education" },
  { href: "#skills", text: "Skills" },
  { href: "#projects", text: "Projects" },
  { href: "#blogs", text: "Blogs", isVisible: false },
  { href: "#contact", text: "Contact" },
];

export const INITIAL_EXPERIENCE = {
  company: "",
  current: true,
  endDate: "Present",
  highlights: [""],
  location: "",
  role: "",
  startDate: "2024",
  summary: "",
  technologies: [],
  type: "Full-time",
};

export const INITIAL_SKILL_CATEGORY = {
  name: "",
  skills: [{ name: "", level: "Expert", featured: true }],
};

export const INITIAL_EDUCATION = {
  degree: "",
  endYear: "2024",
  field: "",
  highlights: [""],
  honors: "",
  institution: "",
  location: "",
  startYear: "2020",
};

export const INITIAL_PROJECT = {
  demoUrl: "",
  description: "",
  featured: false,
  githubUrl: "",
  highlights: [""],
  role: "Lead Architect",
  tagline: "",
  technologies: [],
  title: "",
  year: "2026",
};

export const INITIAL_PORTFOLIO = {
  description: "",
  images: [""],
  link: "",
  tagline: "",
  technologies: [],
  title: "",
  year: "2026",
};