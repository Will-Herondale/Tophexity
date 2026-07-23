"use client";

import { clsx } from "clsx";

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  className?: string;
}

export default function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  className,
}: SliderProps) {
  return (
    <div className={clsx("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-secondary">{label}</label>
        {showValue && (
          <span className="text-sm font-semibold text-accent">{value}</span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface/50 accent-accent"
      />
      <div className="flex justify-between text-xs text-text-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
