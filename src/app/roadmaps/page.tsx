"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoadmapsHistory } from "@/lib/api";
import type { Roadmap } from "@/types/roadmap";
import RoadmapCard from "@/components/roadmaps/RoadmapCard";
import Button from "@/components/ui/Button";
import { Map, RefreshCw } from "lucide-react";

export default function RoadmapsPage() {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    getRoadmapsHistory(page)
      .then((data) => { if (!cancelled) { setRoadmaps(data.items); setTotalPages(data.total_pages); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 bg-background">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">Learning Roadmaps</h1>
          <p className="mt-1 text-sm text-text-secondary">Step-by-step plans for your career path</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPage(page)}>
          <RefreshCw className="mr-1 h-4 w-4" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-light border-t-accent" />
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface/80">
            <Map className="h-8 w-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] text-foreground">No roadmaps yet</h3>
          <p className="mt-2 text-sm text-text-secondary">Roadmaps will appear here once the AI generates personalized learning paths for you.</p>
          <Button className="mt-6" onClick={() => router.push("/careers")}>Explore Careers</Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {roadmaps.map((rm) => (
              <RoadmapCard key={rm.id} roadmap={rm} onClick={(id) => router.push(`/roadmaps/${id}`)} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
