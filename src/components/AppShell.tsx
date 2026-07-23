"use client";

import Sidebar from "@/components/nav/Sidebar";
import { usePathname } from "next/navigation";

const noSidebarRoutes = ["/login", "/register", "/"];
const fullHeightRoutes = ["/chat"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !noSidebarRoutes.includes(pathname);
  const isFullHeight = fullHeightRoutes.some((r) => pathname.startsWith(r));

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className={`flex-1 ${isFullHeight ? "overflow-hidden" : "overflow-y-auto"}`}>
        {children}
      </main>
    </div>
  );
}
