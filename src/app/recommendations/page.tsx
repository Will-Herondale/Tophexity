"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getRecommendationsHistory, generateRecommendation, regenerateRecommendation } from "@/lib/api";
import type { Recommendation } from "@/types/recommendation";
import RecommendationCard from "@/components/recommendations/RecommendationCard";
import Button from "@/components/ui/Button";
import GenerationProgress from "@/components/ui/GenerationProgress";
import { useGenerationProgress } from "@/hooks/useGenerationProgress";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Star, RefreshCw, Sparkles } from "lucide-react";

function newProgressToken(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `pg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function RecommendationsPage() {
  usePageTitle("Recommendations");
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progressToken, setProgressToken] = useState<string | null>(null);
  const { progress, elapsedSeconds, stop } = useGenerationProgress(progressToken);
  const [genError, setGenError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecs = useCallback((p: number) => {
    setLoading(true);
    setFetchError(null);
    getRecommendationsHistory(p)
      .then((data) => { setRecommendations(data.items); setTotalPages(data.total_pages); })
      .catch(() => setFetchError("Failed to load recommendations"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getRecommendationsHistory(page)
      .then((data) => {
        if (!cancelled) { setFetchError(null); setRecommendations(data.items); setTotalPages(data.total_pages); }
      })
      .catch(() => { if (!cancelled) setFetchError("Failed to load recommendations"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  const handleGenerate = async () => {
    const token = newProgressToken();
    setGenerating(true);
    setProgressToken(token);
    setGenError(null);
    try {
      if (recommendations.length > 0 && recommendations[0]?.id) {
        await regenerateRecommendation(recommendations[0].id, token);
      } else {
        await generateRecommendation({ include_profile: true, max_results: 10, progress_token: token });
      }
      fetchRecs(1);
      setPage(1);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setGenError(e?.response?.data?.detail || e?.message || "Failed to generate recommendations");
    } finally {
      stop();
      setProgressToken(null);
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
            {recommendations.length > 0 ? (
              <RefreshCw className={`mr-1 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            ) : (
              <Sparkles className={`mr-1 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            )}
            {generating
              ? "Generating..."
              : recommendations.length > 0
                ? "Regenerate Recommendations"
                : "Get AI Recommendations"}
          </Button>
        </div>
      </div>

      {generating && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-6">
          <GenerationProgress
            percent={progress?.percent ?? 5}
            phase={progress?.phase ?? "Starting..."}
            message={progress?.message ?? "Preparing your personalized analysis"}
            elapsedSeconds={elapsedSeconds}
          />
        </div>
      )}

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {fetchError}
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
              <RecommendationCard key={rec.id} recommendation={rec} />
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