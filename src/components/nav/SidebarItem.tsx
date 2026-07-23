"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";

interface SidebarItemProps {
  href: string;
  label: string;
  icon: string;
  collapsed?: boolean;
}

export default function SidebarItem({ href, label, icon, collapsed = false }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (Icons as any)[icon] || Icons.LayoutDashboard;

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        collapsed ? "justify-center" : ""
      } ${
        isActive
          ? "bg-accent/10 text-accent font-medium"
          : "text-text-secondary hover:text-foreground hover:bg-accent/5"
      }`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
