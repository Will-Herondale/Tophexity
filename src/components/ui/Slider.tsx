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
        <label className="text-sm font-medium text-[#8a8a9a]">{label}</label>
        {showValue && (
          <span className="text-sm font-semibold text-[#1E4FA3]">{value}</span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#0d214f]/50 accent-[#1E4FA3]"
      />
      <div className="flex justify-between text-xs text-[#5a5a6a]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
