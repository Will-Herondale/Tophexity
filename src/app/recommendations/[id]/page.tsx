"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getRecommendationById } from "@/lib/api";
import type { Recommendation, RecommendationItem } from "@/types/recommendation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CareerDetailModal from "@/components/careers/CareerDetailModal";
import { ArrowLeft, Star, ExternalLink } from "lucide-react";

export default function RecommendationDetailPage() {
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
  const scoreStyle =
    item.match_score >= 90 ? { color: "#4ade80", backgroundColor: "rgba(74, 222, 128, 0.1)" } :
    item.match_score >= 75 ? { color: "#5b9aff", backgroundColor: "rgba(30, 79, 163, 0.1)" } :
    item.match_score >= 60 ? { color: "#fbbf24", backgroundColor: "rgba(251, 191, 36, 0.1)" } :
    { color: "#8a8a9a", backgroundColor: "#112a5e" };

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold bg-accent text-white">
          #{item.rank}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold font-[family-name:var(--font-display)] text-foreground">
                {item.career?.title || "Career"}
              </h3>
              {item.career?.description && (
                <p className="mt-1 text-xs text-text-secondary [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">{item.career.description}</p>
              )}
            </div>
            <span className={`ml-3 rounded-full px-3 py-1 text-sm font-bold`} style={scoreStyle}>
              {item.match_score}%
            </span>
          </div>
          {item.reasoning && (
            <p className="mt-2 text-sm text-text-secondary">{item.reasoning}</p>
          )}
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
