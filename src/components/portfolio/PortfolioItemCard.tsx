"use client";

import type { PortfolioItem } from "@/types/portfolio";
import { PORTFOLIO_ITEM_TYPES } from "@/lib/constants";
import Card from "@/components/ui/Card";
import { ExternalLink, Edit3, Trash2 } from "lucide-react";

function getTypeBadge(type: string) {
  const colors: Record<string, string> = {
    project: "bg-accent/20 text-accent-light",
    hackathon: "bg-purple-500/20 text-purple-300",
    competition: "bg-red-500/20 text-red-300",
    certificate: "bg-green-500/20 text-green-300",
    research: "bg-indigo-500/20 text-indigo-300",
    internship: "bg-amber-500/20 text-amber-300",
    olympiad: "bg-pink-500/20 text-pink-300",
    leadership: "bg-teal-500/20 text-teal-300",
    volunteering: "bg-cyan-500/20 text-cyan-300",
    achievement: "bg-orange-500/20 text-orange-300",
  };
  const label = PORTFOLIO_ITEM_TYPES.find((t) => t.value === type)?.label || type;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[type] || "bg-accent/20 text-text-secondary"}`}>
      {label}
    </span>
  );
}

interface PortfolioItemCardProps {
  item: PortfolioItem;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
}

export default function PortfolioItemCard({ item, onEdit, onDelete }: PortfolioItemCardProps) {
  return (
    <Card className="group relative">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-foreground">{item.title}</h3>
            {getTypeBadge(item.item_type)}
          </div>
          {item.description && (
            <p className="mt-1.5 text-xs line-clamp-2 text-text-secondary">{item.description}</p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              View link
            </a>
          )}
          {item.skills_used && Object.keys(item.skills_used).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.keys(item.skills_used).map((skill) => (
                <span key={skill} className="rounded px-1.5 py-0.5 text-[10px] text-text-secondary" style={{ backgroundColor: "#112a5e" }}>
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="ml-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(item)} className="rounded p-1 hover:bg-surface/30 transition-colors text-text-muted">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(item)} className="rounded p-1 hover:bg-red-500/20 hover:text-red-400 transition-colors text-text-muted">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
