"use client";

interface GenerationProgressProps {
  percent: number;
  phase: string;
  message?: string;
  elapsedSeconds?: number;
  compact?: boolean;
}

export default function GenerationProgress({ percent, phase, message, elapsedSeconds, compact }: GenerationProgressProps) {
  const clamped = Math.max(2, Math.min(100, percent));
  return (
    <div className={compact ? "w-full min-w-[220px]" : "w-full"}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className={`truncate font-medium text-foreground ${compact ? "text-xs" : "text-sm"}`}>{phase}</span>
        <span className={`shrink-0 tabular-nums text-text-muted ${compact ? "text-[11px]" : "text-xs"}`}>
          {Math.round(clamped)}%
          {elapsedSeconds !== undefined && elapsedSeconds > 0 ? ` · ${elapsedSeconds}s` : ""}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-light">
        <div
          className="relative h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-700 ease-out"
          style={{ width: `${clamped}%` }}
        >
          <div className="absolute inset-0 animate-pulse rounded-full bg-white/25" />
        </div>
      </div>
      {message && <p className={`mt-1.5 text-text-muted ${compact ? "text-[11px]" : "text-xs"}`}>{message}</p>}
    </div>
  );
}
