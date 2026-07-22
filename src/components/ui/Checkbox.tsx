"use client";

import { clsx } from "clsx";

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export default function Checkbox({ label, checked, onChange, className }: CheckboxProps) {
  return (
    <label className={clsx("flex items-center gap-2 cursor-pointer", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-[#1E4FA3]/30 bg-[#0d214f]/30 text-[#1E4FA3] focus:ring-[#1E4FA3]/30 focus:ring-offset-0"
      />
      <span className="text-sm text-[#f0f0f0]">{label}</span>
    </label>
  );
}
