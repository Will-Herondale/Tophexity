"use client";

import type { PortfolioItem } from "@/types/portfolio";
import { PORTFOLIO_ITEM_TYPES } from "@/lib/constants";
import Card from "@/components/ui/Card";
import { ExternalLink, Edit3, Trash2, MoreHorizontal } from "lucide-react";

const typeColors: Record<string, { bg: string; text: string; dot: string }> = {
  project: { bg: "bg-accent/15", text: "text-accent-light", dot: "bg-accent" },
  hackathon: { bg: "bg-purple-500/15", text: "text-purple-300", dot: "bg-purple-500" },
  competition: { bg: "bg-red-500/15", text: "text-red-300", dot: "bg-red-500" },
  certificate: { bg: "bg-green-500/15", text: "text-green-300", dot: "bg-green-500" },
  research: { bg: "bg-indigo-500/15", text: "text-indigo-300", dot: "bg-indigo-500" },
  internship: { bg: "bg-amber-500/15", text: "text-amber-300", dot: "bg-amber-500" },
  olympiad: { bg: "bg-pink-500/15", text: "text-pink-300", dot: "bg-pink-500" },
  leadership: { bg: "bg-teal-500/15", text: "text-teal-300", dot: "bg-teal-500" },
  volunteering: { bg: "bg-cyan-500/15", text: "text-cyan-300", dot: "bg-cyan-500" },
  achievement: { bg: "bg-orange-500/15", text: "text-orange-300", dot: "bg-orange-500" },
};

function getTypeStyle(type: string) {
  return typeColors[type] || { bg: "bg-accent/10", text: "text-text-secondary", dot: "bg-accent/50" };
}

function getTypeLabel(type: string) {
  return PORTFOLIO_ITEM_TYPES.find((t) => t.value === type)?.label || type;
}

interface PortfolioItemCardProps {
  item: PortfolioItem;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
}

export default function PortfolioItemCard({ item, onEdit, onDelete }: PortfolioItemCardProps) {
  const style = getTypeStyle(item.item_type);

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div className={`absolute top-0 left-0 h-full w-0.5 ${style.dot} opacity-30`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${style.dot} shrink-0`} />
            <h3 className="truncate text-sm font-semibold font-[family-name:var(--font-display)] text-foreground">
              {item.title}
            </h3>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
              {getTypeLabel(item.item_type)}
            </span>
          </div>
          {item.description && (
            <p className="mt-2 text-xs leading-relaxed line-clamp-2 text-text-secondary">{item.description}</p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {new URL(item.url).hostname.replace("www.", "")}
            </a>
          )}
          {item.skills_used && Object.keys(item.skills_used).length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {Object.entries(item.skills_used).map(([skill, level]) => (
                <span key={skill}
                  className="inline-flex items-center gap-1 rounded-md bg-surface-light/30 px-2 py-0.5 text-[10px] font-medium text-text-muted">
                  {skill}
                  <span className="text-[9px] uppercase tracking-wider text-text-muted/60">{level}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(item)}
            className="rounded-lg p-1.5 text-text-muted hover:bg-accent/10 hover:text-accent transition-colors">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(item)}
            className="rounded-lg p-1.5 text-text-muted hover:bg-red-500/15 hover:text-red-400 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
