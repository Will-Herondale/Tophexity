export const APP_NAME = "Tophexity";

export const API_BASE_URL = "https://tophexity-func.azurewebsites.net";
export const API_PREFIX = "/v1";

export const EDUCATION_LEVELS = [
  { value: "high_school", label: "High School" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "phd", label: "PhD" },
  { value: "diploma", label: "Diploma / Certificate Program" },
  { value: "none", label: "No Formal Education" },
] as const;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number]["value"];

export const PORTFOLIO_ITEM_TYPES = [
  { value: "project", label: "Project" },
  { value: "hackathon", label: "Hackathon" },
  { value: "competition", label: "Competition" },
  { value: "certificate", label: "Certificate" },
  { value: "research", label: "Research" },
  { value: "internship", label: "Internship" },
  { value: "olympiad", label: "Olympiad" },
  { value: "leadership", label: "Leadership" },
  { value: "volunteering", label: "Volunteering" },
  { value: "achievement", label: "Achievement" },
  { value: "contract", label: "Contract Work" },
  { value: "freelance", label: "Freelance Project" },
  { value: "publication", label: "Publication" },
  { value: "speaking", label: "Speaking / Conference" },
  { value: "award", label: "Award / Recognition" },
  { value: "open_source", label: "Open Source Contribution" },
  { value: "consulting", label: "Consulting Engagement" },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "student", label: "Student (School / College)" },
  { value: "entry", label: "Entry Level (0-2 years)" },
  { value: "mid", label: "Mid Level (3-7 years)" },
  { value: "senior", label: "Senior (8-15 years)" },
  { value: "executive", label: "Executive (15+ years)" },
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]["value"];

export type PortfolioItemType = (typeof PORTFOLIO_ITEM_TYPES)[number]["value"];

export const VALID_PORTFOLIO_ITEM_TYPES = PORTFOLIO_ITEM_TYPES.map((t) => t.value);

export const VALID_SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;
export type SkillLevel = (typeof VALID_SKILL_LEVELS)[number];

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export const DEFAULT_SKILL_LEVEL: SkillLevel = "intermediate";

export const SKILL_PRESETS = {
  "Programming Languages": [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
    "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB",
  ],
  "Web Development": [
    "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express", "Django",
    "Flask", "FastAPI", "HTML", "CSS", "Tailwind CSS",
  ],
  "Data & AI": [
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn",
    "Data Analysis", "Data Visualization",
  ],
  "Design": [
    "Figma", "Adobe Photoshop", "Adobe Illustrator", "UI/UX Design",
    "Graphic Design", "Wireframing", "Prototyping",
  ],
  "Tools & Platforms": [
    "Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux",
    "VS Code", "Jira", "CI/CD",
  ],
  "Soft Skills": [
    "Leadership", "Communication", "Teamwork", "Problem Solving",
    "Time Management", "Critical Thinking",
  ],
  "Business": [
    "Project Management", "Product Management", "Agile", "Scrum",
    "Marketing", "Financial Analysis", "Strategic Planning",
  ],
} as const;

export const VALID_CHAT_ROLES = ["user", "assistant", "system"] as const;
export type ChatRole = (typeof VALID_CHAT_ROLES)[number];

export const VALID_TRANSITION_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type TransitionDifficulty = (typeof VALID_TRANSITION_DIFFICULTIES)[number];

export const VALID_DEMAND_LEVELS = ["low", "below_average", "average", "above_average", "high", "very_high"] as const;
export type DemandLevel = (typeof VALID_DEMAND_LEVELS)[number];

export const VALID_GROWTH_OUTLOOKS = ["declining", "below_average", "average", "above_average", "high", "excellent"] as const;
export type GrowthOutlook = (typeof VALID_GROWTH_OUTLOOKS)[number];

export const DEFAULT_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", visible: true },
  { id: "profile", label: "Profile", href: "/profile", icon: "User", visible: true },
  { id: "careers", label: "Careers", href: "/careers", icon: "Briefcase", visible: true },
  { id: "portfolio", label: "Portfolio", href: "/portfolio", icon: "FolderOpen", visible: true },
  { id: "recommendations", label: "Recommendations", href: "/recommendations", icon: "Star", visible: true },
  { id: "roadmaps", label: "Roadmaps", href: "/roadmaps", icon: "Map", visible: true },
  { id: "backups", label: "Backup Plans", href: "/backups", icon: "Shield", visible: true },
  { id: "chat", label: "Chat", href: "/chat", icon: "MessageSquare", visible: true },
  { id: "settings", label: "Settings", href: "/settings", icon: "Settings", visible: true },
] as const;
