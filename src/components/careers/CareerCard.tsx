"use client";

import { useState } from "react";
import type { Career } from "@/types/career";
import Card from "@/components/ui/Card";
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, Briefcase, Heart, Sparkles, Check } from "lucide-react";

const demandColors: Record<string, string> = {
  very_high: "bg-emerald-500/15 text-emerald-400",
  high: "bg-emerald-500/15 text-emerald-400",
  above_average: "bg-accent/20 text-accent-light",
  average: "bg-text-muted/20 text-text-secondary",
  below_average: "bg-amber-500/15 text-amber-400",
  low: "bg-red-500/15 text-red-400",
};

const growthColors: Record<string, string> = {
  excellent: "text-emerald-400",
  high: "text-emerald-400",
  above_average: "text-accent-light",
  average: "text-text-secondary",
  below_average: "text-amber-400",
  declining: "text-red-400",
};

interface CareerCardProps {
  career: Career;
  onViewDetails: (career: Career) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  onAskAI?: (career: Career) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export default function CareerCard({
  career, onViewDetails,
  isFavorited, onToggleFavorite, onAskAI,
  selectable, selected, onToggleSelect,
}: CareerCardProps) {
  const [expanded, setExpanded] = useState(false);

  const educationText = career.required_education
    ? Object.entries(career.required_education).map(([k, v]) => `${k}: ${v}`).join(", ")
    : null;

  const skillsText = career.typical_skills
    ? Object.keys(career.typical_skills).join(", ")
    : null;

  return (
    <Card className={`transition-all ${selected ? "ring-2 ring-accent" : ""}`}>
      <div className="cursor-pointer" onClick={() => (selectable && onToggleSelect) ? onToggleSelect(career.id) : setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {selectable && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSelect?.(career.id); }}
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                  selected ? "border-accent bg-accent text-white" : "border-border bg-background/50 text-transparent hover:border-border-light"
                }`}
              >
                {selected && <Check className="h-3 w-3" />}
              </button>
            )}
            <div className="flex-1">
              <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-foreground">{career.title}</h3>
              {career.description && (
                <p className="mt-1 text-sm text-text-secondary line-clamp-2">{career.description}</p>
              )}
            </div>
          </div>
          <div className="ml-2 flex items-center gap-1 flex-shrink-0">
            {onAskAI && (
              <button
                onClick={(e) => { e.stopPropagation(); onAskAI(career); }}
                className="p-1.5 rounded-lg text-text-muted hover:bg-accent/10 hover:text-accent transition-colors"
                title="Ask AI about this career"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            )}
            {onToggleFavorite && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(career.id); }}
                className="p-1.5 rounded-lg text-text-muted hover:bg-accent/10 transition-colors"
                title={isFavorited ? "Remove from favorites" : "Save to favorites"}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-accent text-accent" : "hover:text-accent"}`} />
              </button>
            )}
            {!selectable && (
              <span className="text-text-muted">
                {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {career.demand_level && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${demandColors[career.demand_level] || "bg-text-muted/20 text-text-secondary"}`}>
              {career.demand_level.replace("_", " ")} demand
            </span>
          )}
          {career.growth_outlook && (
            <span className={`flex items-center gap-1 text-xs ${growthColors[career.growth_outlook] || "text-text-secondary"}`}>
              <TrendingUp className="h-3 w-3" />
              {career.growth_outlook.replace("_", " ")} growth
            </span>
          )}
          {career.average_salary && (
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <DollarSign className="h-3 w-3" />
              ${(career.average_salary / 1000).toFixed(0)}k avg
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-border pt-4">
          {career.description && (
            <p className="mb-3 text-sm text-text-secondary">{career.description}</p>
          )}
          {educationText && (
            <p className="mb-2 text-xs text-text-muted">
              <Briefcase className="mr-1 inline h-3 w-3" />
              Typical education: {educationText}
            </p>
          )}
          {skillsText && (
            <p className="mb-3 text-xs text-text-muted">Typical skills: {skillsText}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(career);
              }}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80"
            >
              View Full Details
            </button>
            {onAskAI && (
              <button
                onClick={(e) => { e.stopPropagation(); onAskAI(career); }}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background/50 px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ask AI
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
