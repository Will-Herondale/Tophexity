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
        className="h-4 w-4 rounded border-border-light bg-surface/30 text-accent focus:ring-accent/30 focus:ring-offset-0"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}
