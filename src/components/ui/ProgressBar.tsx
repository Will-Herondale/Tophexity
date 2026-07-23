"use client";

import { clsx } from "clsx";

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export default function ProgressBar({
  progress,
  label,
  showPercentage = true,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className={clsx("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          {showPercentage && <span className="text-sm text-text-secondary">{clamped}%</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface/50">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
