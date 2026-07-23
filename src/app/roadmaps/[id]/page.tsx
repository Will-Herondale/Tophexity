"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getRoadmapById } from "@/lib/api";
import type { Roadmap } from "@/types/roadmap";
import RoadmapTimeline from "@/components/roadmaps/RoadmapTimeline";
import { ArrowLeft, Clock } from "lucide-react";

export default function RoadmapDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getRoadmapById(id)
      .then((data) => { if (!cancelled) setRoadmap(data); })
      .catch(() => { if (!cancelled) router.push("/roadmaps"); })
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

  if (!roadmap) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 bg-background">
      <button onClick={() => router.push("/roadmaps")} className="mb-6 flex items-center gap-2 text-sm transition-colors hover:text-foreground text-text-secondary">
        <ArrowLeft className="h-4 w-4" /> Back to Roadmaps
      </button>

      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">{roadmap.title || "Learning Roadmap"}</h1>
        {roadmap.description && <p className="mt-2 text-sm text-text-secondary">{roadmap.description}</p>}
        <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
          <span>Created {new Date(roadmap.created_at).toLocaleDateString()}</span>
          {roadmap.estimated_duration_months && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {roadmap.estimated_duration_months} months estimated
            </span>
          )}
        </div>
      </div>

      {roadmap.steps.length > 0 ? (
        <div className="rounded-xl border p-6 border-border bg-surface">
          <RoadmapTimeline steps={roadmap.steps} />
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border bg-surface p-12 text-center">
          <p className="text-sm text-text-secondary">This roadmap has no steps yet.</p>
        </div>
      )}
    </div>
  );
}
