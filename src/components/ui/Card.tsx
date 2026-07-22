"use client";

import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, className, onClick, hover = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-2xl border border-[#1E4FA3]/10 bg-[#0d214f]/30 p-6",
        hover && "cursor-pointer transition-all duration-200 hover:border-[#1E4FA3]/20 hover:shadow-lg hover:shadow-[#1E4FA3]/5",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={clsx("font-[family-name:var(--font-display)] text-lg font-semibold text-[#f0f0f0]", className)}>{children}</h3>;
}
