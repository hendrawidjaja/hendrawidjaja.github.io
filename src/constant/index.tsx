export const WORDING = {
  FULLNAME: "Hendra Widjaja",
};

export const MENU = [
  { href: "#experience", text: "Experience" },
  { href: "#education", text: "Education" },
  { href: "#skills", text: "Skills" },
  { href: "#projects", text: "Projects" },
  { href: "#blogs", text: "Blogs", isVisible: false },
  { href: "#contact", text: "Contact" },
];

const INITIAL_EXPERIENCE = {
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

const INITIAL_SKILL_CATEGORY = {
  name: "",
  skills: [{ name: "", level: "Expert", featured: true }],
};

const INITIAL_EDUCATION = {
  degree: "",
  endYear: "2024",
  field: "",
  highlights: [""],
  honors: "",
  institution: "",
  location: "",
  startYear: "2020",
};

const INITIAL_PROJECT = {
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