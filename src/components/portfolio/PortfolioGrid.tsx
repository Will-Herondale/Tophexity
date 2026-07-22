"use client";

import type { PortfolioItem } from "@/types/portfolio";
import PortfolioItemCard from "./PortfolioItemCard";

interface PortfolioGridProps {
  items: PortfolioItem[];
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
}

export default function PortfolioGrid({ items, onEdit, onDelete }: PortfolioGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <PortfolioItemCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
