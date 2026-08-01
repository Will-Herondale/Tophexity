"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getProgress, type GenerationProgress } from "@/lib/api";

export function useGenerationProgress(token: string | null) {
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const activeRef = useRef(true);
  const timerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!token) return;
    activeRef.current = true;
    queueMicrotask(() => { setProgress(null); setElapsedSeconds(0); });
    const start = Date.now();
    const tick = async () => {
      if (!activeRef.current) return;
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
      try {
        const p = await getProgress(token);
        if (activeRef.current) setProgress(p);
      } catch {
        // progress token may not be available yet or expired; keep polling
      }
      if (activeRef.current) {
        timerRef.current = window.setTimeout(tick, 1500);
      }
    };
    timerRef.current = window.setTimeout(tick, 300);
    return () => {
      activeRef.current = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [token]);

  return { progress, elapsedSeconds, stop };
}
