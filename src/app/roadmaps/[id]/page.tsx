"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getRoadmapById, updateRoadmap } from "@/lib/api";
import type { Roadmap } from "@/types/roadmap";
import RoadmapTimeline from "@/components/roadmaps/RoadmapTimeline";
import Button from "@/components/ui/Button";
import { ArrowLeft, Clock, Pause, Play, XCircle } from "lucide-react";

export default function RoadmapDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getRoadmapById(id)
      .then((data) => { if (!cancelled) setRoadmap(data); })
      .catch(() => { if (!cancelled) router.push("/roadmaps"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, router]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!roadmap || updating) return;
    const label = newStatus === "paused" ? "pause" : newStatus === "cancelled" ? "cancel" : "resume";
    if (!confirm(`Are you sure you want to ${label} this roadmap?`)) return;
    setUpdating(true);
    try {
      const updated = await updateRoadmap(roadmap.id, { status: newStatus });
      setRoadmap(updated);
    } catch (err) {
      console.error(`Failed to ${label} roadmap:`, err);
    } finally {
      setUpdating(false);
    }
  }, [roadmap, updating]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-light border-t-accent" />
      </div>
    );
  }

  if (!roadmap) return null;

  const isActive = roadmap.status === "active";
  const isPaused = roadmap.status === "paused";
  const isCancelled = roadmap.status === "cancelled";

  const statusBadge = isCancelled
    ? <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">Cancelled</span>
    : isPaused
      ? <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">Paused</span>
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 bg-background">
      <button onClick={() => router.push("/roadmaps")} className="mb-6 flex items-center gap-2 text-sm transition-colors hover:text-foreground text-text-secondary">
        <ArrowLeft className="h-4 w-4" /> Back to Roadmaps
      </button>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">{roadmap.title || "Learning Roadmap"}</h1>
            {statusBadge}
          </div>
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
        {!isCancelled && (
          <div className="flex items-center gap-2">
            {isActive && (
              <Button variant="secondary" size="sm" onClick={() => handleStatusChange("paused")} isLoading={updating}>
                <Pause className="h-4 w-4 mr-1" /> Pause
              </Button>
            )}
            {isPaused && (
              <Button variant="secondary" size="sm" onClick={() => handleStatusChange("active")} isLoading={updating}>
                <Play className="h-4 w-4 mr-1" /> Resume
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={() => handleStatusChange("cancelled")} isLoading={updating}>
              <XCircle className="h-4 w-4 mr-1" /> Cancel
            </Button>
          </div>
        )}
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
