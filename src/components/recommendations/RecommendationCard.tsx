"use client";

import type { Recommendation } from "@/types/recommendation";
import Card from "@/components/ui/Card";
import ReasoningView from "@/components/ai/ReasoningView";
import { Star, Calendar, Sparkles, Lightbulb } from "lucide-react";

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export default function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const sorted = [...recommendation.items].sort((a, b) => a.rank - b.rank);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
            {recommendation.title || "Career Recommendation"}
          </h3>
          {recommendation.summary && (
            <p className="mt-1 text-xs text-text-secondary">{recommendation.summary}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(recommendation.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {recommendation.items.length} career{recommendation.items.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="mt-4 space-y-3">
          {sorted.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-surface/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                    {item.rank}
                  </span>
                  {item.career?.title || "Career"}
                </h4>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-white">
                  <Sparkles className="h-3 w-3" />
                  {item.match_score}%
                </span>
              </div>

              {item.career?.description && (
                <p className="mt-1.5 text-xs text-text-secondary line-clamp-2">{item.career.description}</p>
              )}

              {item.reasoning && (
                <div className="mt-2.5 rounded-xl border border-accent/10 bg-accent/[0.02] p-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground/80">Why this career?</p>
                      <ReasoningView text={item.reasoning} className="mt-1" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
