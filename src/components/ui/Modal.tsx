"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={clsx(
          "relative z-10 mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl",
          {
            "w-full max-w-md": size === "sm",
            "w-full max-w-lg": size === "md",
            "w-full max-w-2xl": size === "lg",
            "w-full max-w-4xl": size === "xl",
          }
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">{title}</h2>}
          <button onClick={onClose} className="rounded-lg p-1 text-text-secondary hover:bg-accent/10 hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
