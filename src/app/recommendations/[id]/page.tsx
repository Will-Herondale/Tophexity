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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-700 dark:border-t-indigo-400" />
      </div>
    );
  }

  if (!rec) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button onClick={() => router.push("/recommendations")} className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
        <ArrowLeft className="h-4 w-4" /> Back to Recommendations
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{rec.title || "Career Recommendation"}</h1>
        {rec.summary && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{rec.summary}</p>}
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Generated on {new Date(rec.created_at).toLocaleDateString()}</p>
      </div>

      <div className="space-y-4">
        {rec.items
          .sort((a, b) => a.rank - b.rank)
          .map((item) => (
            <RankedItem key={item.id} item={item} onViewDetails={(careerId) => setDetailCareerId(careerId)} />
          ))}
      </div>

      {rec.items.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <Star className="mx-auto mb-4 h-8 w-8 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No career matches</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This recommendation has no ranked items yet.</p>
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
    item.match_score >= 90 ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30" :
    item.match_score >= 75 ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30" :
    item.match_score >= 60 ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30" :
    "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-700";

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
          #{item.rank}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {item.career?.title || "Career"}
              </h3>
              {item.career?.description && (
                <p className="mt-1 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">{item.career.description}</p>
              )}
            </div>
            <span className={`ml-3 rounded-full px-3 py-1 text-sm font-bold ${scoreColor}`}>
              {item.match_score}%
            </span>
          </div>
          {item.reasoning && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.reasoning}</p>
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
