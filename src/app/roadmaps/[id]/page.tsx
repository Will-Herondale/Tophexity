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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-700 dark:border-t-indigo-400" />
      </div>
    );
  }

  if (!roadmap) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button onClick={() => router.push("/roadmaps")} className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
        <ArrowLeft className="h-4 w-4" /> Back to Roadmaps
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{roadmap.title || "Learning Roadmap"}</h1>
        {roadmap.description && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{roadmap.description}</p>}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span>Created {new Date(roadmap.created_at).toLocaleDateString()}</span>
          {roadmap.estimated_duration_months && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {roadmap.estimated_duration_months} months estimated
            </span>
          )}
        </div>
      </div>

      {roadmap.steps.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <RoadmapTimeline steps={roadmap.steps} />
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">This roadmap has no steps yet.</p>
        </div>
      )}
    </div>
  );
}
