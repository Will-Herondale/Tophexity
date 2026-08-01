"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/nav/Sidebar";

const noSidebarRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/"];
const publicRoutes = ["/careers"];
const fullHeightRoutes = ["/chat"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const showSidebar = !noSidebarRoutes.includes(pathname);
  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const requiresAuth = showSidebar && !isPublic;
  const isFullHeight = fullHeightRoutes.some((r) => pathname.startsWith(r));

  useEffect(() => {
    if (requiresAuth && !isLoading && !user) {
      router.replace("/login");
    }
  }, [requiresAuth, isLoading, user, router]);

  if (!showSidebar) {
    return <>{children}</>;
  }

  if (requiresAuth && (isLoading || !user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
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
