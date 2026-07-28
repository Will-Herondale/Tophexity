"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getRecommendationsHistory, generateRecommendation } from "@/lib/api";
import type { Recommendation } from "@/types/recommendation";
import RecommendationCard from "@/components/recommendations/RecommendationCard";
import Button from "@/components/ui/Button";
import { Star, RefreshCw, Sparkles } from "lucide-react";

export default function RecommendationsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecs = useCallback((p: number) => {
    setLoading(true);
    getRecommendationsHistory(p)
      .then((data) => { setRecommendations(data.items); setTotalPages(data.total_pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      await generateRecommendation({ include_profile: true, max_results: 5 });
      fetchRecs(1);
      setPage(1);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setGenError(e?.response?.data?.detail || e?.message || "Failed to generate recommendations");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">Recommendations</h1>
          <p className="mt-1 text-sm text-text-secondary">Your AI-powered career matches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchRecs(page)} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleGenerate} disabled={generating}>
            <Sparkles className={`mr-1 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating..." : "Get AI Recommendations"}
          </Button>
        </div>
      </div>

      {generating && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center">
            <Sparkles className="h-6 w-6 text-accent animate-pulse" />
          </div>
          <p className="text-sm font-medium text-foreground">AI is analyzing your profile and generating personalized recommendations...</p>
          <p className="mt-1 text-xs text-text-secondary">This can take 30-60 seconds</p>
        </div>
      )}

      {genError && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {genError}
        </div>
      )}

      {loading && !generating ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-light border-t-accent" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Star className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] text-foreground">No recommendations yet</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Complete your profile and let our AI generate personalized career recommendations for you.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/profile")}>
              Complete Your Profile
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              {generating ? "Generating..." : "Get AI Recommendations"}
            </Button>
          </div>
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
              <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
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