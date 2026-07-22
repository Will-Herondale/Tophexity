"use client";

import type { Recommendation } from "@/types/recommendation";
import Card from "@/components/ui/Card";
import { Star, ChevronRight, Calendar } from "lucide-react";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onClick: (id: string) => void;
}

export default function RecommendationCard({ recommendation, onClick }: RecommendationCardProps) {
  return (
    <Card
      hover
      onClick={() => onClick(recommendation.id)}
      className="cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold font-[family-name:var(--font-display)]" style={{ color: "#f0f0f0" }}>
            {recommendation.title || "Career Recommendation"}
          </h3>
          {recommendation.summary && (
            <p className="mt-1 text-xs line-clamp-2" style={{ color: "#8a8a9a" }}>{recommendation.summary}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "#5a5a6a" }}>
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
        <ChevronRight className="h-5 w-5" style={{ color: "#5a5a6a" }} />
      </div>

      {recommendation.items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {recommendation.items.slice(0, 3).map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: "#1E4FA3", color: "#ffffff" }}
            >
              #{item.rank} {item.career?.title || "Career"}
              <span style={{ color: "#5b9aff" }}>({item.match_score}%)</span>
            </span>
          ))}
          {recommendation.items.length > 3 && (
            <span className="text-xs" style={{ color: "#5a5a6a" }}>+{recommendation.items.length - 3} more</span>
          )}
        </div>
      )}
    </Card>
  );
}
