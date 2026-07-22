"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRecommendationsHistory } from "@/lib/api";
import type { Recommendation } from "@/types/recommendation";
import RecommendationCard from "@/components/recommendations/RecommendationCard";
import Button from "@/components/ui/Button";
import { Star, RefreshCw } from "lucide-react";

export default function RecommendationsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    getRecommendationsHistory(page)
      .then((data) => {
        if (!cancelled) { setRecommendations(data.items); setTotalPages(data.total_pages); }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8" style={{ backgroundColor: "#0a0a0f" }}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold" style={{ color: "#f0f0f0" }}>Recommendations</h1>
          <p className="mt-1 text-sm" style={{ color: "#8a8a9a" }}>Your AI-powered career matches</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPage(page)}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E4FA3]/30 border-t-[#1E4FA3]" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center" style={{ borderColor: "rgba(30, 79, 163, 0.15)", backgroundColor: "#0d214f" }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#112a5e" }}>
            <Star className="h-8 w-8" style={{ color: "#5a5a6a" }} />
          </div>
          <h3 className="text-lg font-semibold font-[family-name:var(--font-display)]" style={{ color: "#f0f0f0" }}>No recommendations yet</h3>
          <p className="mt-2 text-sm" style={{ color: "#8a8a9a" }}>
            Complete your profile and our AI will generate personalized career recommendations for you.
          </p>
          <Button className="mt-6" onClick={() => router.push("/profile")}>
            Complete Your Profile
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onClick={(id) => router.push(`/recommendations/${id}`)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm" style={{ color: "#8a8a9a" }}>Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
