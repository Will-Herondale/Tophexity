"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getMe } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

export function useAuthInit() {
  const { setUser, setIsLoading } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    getMe()
      .then((data: AuthUser) => {
        if (!cancelled) {
          setUser(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user_id");
          localStorage.removeItem("email");
          document.cookie = "access_token=; path=/; max-age=0";
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [setUser, setIsLoading]);
}
