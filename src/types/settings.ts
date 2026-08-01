export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  visible: boolean;
  order?: number;
}

export interface UserSettings {
  navItems: NavItem[];
  theme: "light" | "dark" | "system";
}

export const DEFAULT_SETTINGS: UserSettings = {
  navItems: [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", visible: true, order: 0 },
    { id: "profile", label: "Profile", href: "/profile", icon: "User", visible: true, order: 1 },
    { id: "careers", label: "Careers", href: "/careers", icon: "Briefcase", visible: true, order: 2 },
    { id: "portfolio", label: "Portfolio", href: "/portfolio", icon: "FolderOpen", visible: true, order: 3 },
    { id: "recommendations", label: "Recommendations", href: "/recommendations", icon: "Star", visible: true, order: 4 },
    { id: "roadmaps", label: "Roadmaps", href: "/roadmaps", icon: "Map", visible: true, order: 5 },
    { id: "backups", label: "Backup Plans", href: "/backups", icon: "Shield", visible: true, order: 6 },
    { id: "chat", label: "Chat", href: "/chat", icon: "MessageSquare", visible: true, order: 7 },
    { id: "settings", label: "Settings", href: "/settings", icon: "Settings", visible: true, order: 8 },
    { id: "dbviewer", label: "DB Viewer", href: "/system/db", icon: "Database", visible: true, order: 9 },
  ],
  theme: "dark",
};
