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
        "rounded-2xl bg-surface/20 p-6 shadow-sm",
        hover && "cursor-pointer transition-all duration-200 hover:bg-surface/30 hover:shadow-md",
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
  return <h3 className={clsx("font-[family-name:var(--font-display)] text-lg font-semibold text-foreground", className)}>{children}</h3>;
}
