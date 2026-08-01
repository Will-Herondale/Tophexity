"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getRecommendationById } from "@/lib/api";
import type { Recommendation, RecommendationItem } from "@/types/recommendation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CareerDetailModal from "@/components/careers/CareerDetailModal";
import ReasoningView from "@/components/ai/ReasoningView";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ArrowLeft, Star, ExternalLink, Lightbulb, TrendingUp, Target, Zap } from "lucide-react";

export default function RecommendationDetailPage() {
  usePageTitle("Recommendation Details");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailCareerId, setDetailCareerId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getRecommendationById(id)
      .then((data) => { if (!cancelled) setRec(data); })
      .catch(() => { if (!cancelled) router.push("/recommendations"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-light border-t-accent" />
      </div>
    );
  }

  if (!rec) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button onClick={() => router.push("/recommendations")} className="mb-6 flex items-center gap-2 text-sm transition-colors hover:text-foreground text-text-secondary">
        <ArrowLeft className="h-4 w-4" /> Back to Recommendations
      </button>

      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">{rec.title || "Career Recommendation"}</h1>
        {rec.summary && <p className="mt-2 text-sm text-text-secondary">{rec.summary}</p>}
        <p className="mt-1 text-xs text-text-muted">Generated on {new Date(rec.created_at).toLocaleDateString()}</p>
      </div>

      <div className="space-y-4">
        {rec.items
          .sort((a, b) => a.rank - b.rank)
          .map((item) => (
            <RankedItem key={item.id} item={item} onViewDetails={(careerId) => setDetailCareerId(careerId)} />
          ))}
      </div>

      {rec.items.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border bg-surface p-12 text-center">
          <Star className="mx-auto mb-4 h-8 w-8 text-text-muted" />
          <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] text-foreground">No career matches</h3>
          <p className="mt-2 text-sm text-text-secondary">This recommendation has no ranked items yet.</p>
        </div>
      )}

      {detailCareerId && (
        <CareerDetailModal careerId={detailCareerId} onClose={() => setDetailCareerId(null)} />
      )}
    </div>
  );
}

function RankedItem({ item, onViewDetails }: { item: RecommendationItem; onViewDetails: (careerId: string) => void }) {
  const scoreColor =
    item.match_score >= 90 ? "text-emerald-400 bg-emerald-500/10" :
    item.match_score >= 75 ? "text-blue-400 bg-accent/10" :
    item.match_score >= 60 ? "text-amber-400 bg-amber-500/10" :
    "text-text-muted bg-surface/15";
  const scoreBarWidth = `${Math.min(item.match_score, 100)}%`;
  const scoreBarColor =
    item.match_score >= 90 ? "bg-emerald-400" :
    item.match_score >= 75 ? "bg-accent" :
    item.match_score >= 60 ? "bg-amber-400" :
    "bg-text-muted";

  return (
    <Card className="group transition-all hover:bg-surface/25">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-sm shadow-accent/30">
          #{item.rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold font-[family-name:var(--font-display)] text-foreground">
                {item.career?.title || "Career"}
              </h3>
              {item.career?.description && (
                <p className="mt-1 text-xs text-text-secondary line-clamp-2">{item.career.description}</p>
              )}
            </div>
            <div className="flex flex-col items-center shrink-0">
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${scoreColor}`}>
                {item.match_score}%
              </span>
              <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-surface/20">
                <div className={`h-full rounded-full transition-all ${scoreBarColor}`} style={{ width: scoreBarWidth }} />
              </div>
            </div>
          </div>

          {item.reasoning && (
            <div className="mt-3 rounded-xl border border-accent/10 bg-accent/[0.02] p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <p className="text-xs font-medium text-foreground/80">Why this career?</p>
                  <ReasoningView text={item.reasoning} className="mt-1" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {item.career?.average_salary && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/5 px-2 py-1 text-xs text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                ${(item.career.average_salary / 1000).toFixed(0)}k avg.
              </span>
            )}
            {item.career?.growth_outlook && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/5 px-2 py-1 text-xs text-blue-400">
                <Zap className="h-3 w-3" />
                {item.career.growth_outlook}
              </span>
            )}
            {item.career?.demand_level && (
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/5 px-2 py-1 text-xs text-purple-400">
                <Target className="h-3 w-3" />
                {item.career.demand_level} demand
              </span>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => onViewDetails(item.career_id)}>
              <ExternalLink className="mr-1 h-3 w-3" />
              View Career Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
