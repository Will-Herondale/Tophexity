"use client";

import { type InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#8a8a9a]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors",
            "placeholder:text-[#5a5a6a]",
            "focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]/30",
            error
              ? "border-red-500 text-red-400 placeholder:text-red-400 focus:border-red-500 focus:ring-red-500/30"
              : "border-[#1E4FA3]/15 bg-[#0d214f]/30 text-[#f0f0f0] focus:border-[#1E4FA3]/40",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#5a5a6a]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
