"use client";

import type { RoadmapStep } from "@/types/roadmap";
import { Clock } from "lucide-react";

interface RoadmapTimelineProps {
  steps: RoadmapStep[];
}

export default function RoadmapTimeline({ steps }: RoadmapTimelineProps) {
  const sorted = [...steps].sort((a, b) => a.step_order - b.step_order);

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ backgroundColor: "rgba(30, 79, 163, 0.2)" }} />
      <div className="space-y-6">
          {sorted.map((step) => (
          <div key={step.id} className="relative flex gap-4">
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: "#1E4FA3" }}>
              {step.step_order}
            </div>
            <div className="flex-1 rounded-lg border p-4" style={{ borderColor: "rgba(30, 79, 163, 0.1)", backgroundColor: "rgba(13, 33, 79, 0.3)" }}>
              <h4 className="text-sm font-semibold font-[family-name:var(--font-display)]" style={{ color: "#f0f0f0" }}>{step.title}</h4>
              {step.description && <p className="mt-1 text-xs" style={{ color: "#8a8a9a" }}>{step.description}</p>}
              {step.duration_months && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs" style={{ color: "#5a5a6a" }}>
                  <Clock className="h-3 w-3" /> {step.duration_months} month{step.duration_months !== 1 ? "s" : ""}
                </span>
              )}
              {Array.isArray(step.resources) && step.resources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {step.resources.map((res, i) => {
                    const label = res.name || res.type || "Resource";
                    const content = (
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px]"
                        style={{ backgroundColor: "rgba(30, 79, 163, 0.15)", color: "#8a8a9a" }}>
                        {label}
                      </span>
                    );
                    return res.url ? (
                      <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-75">
                        {content}
                      </a>
                    ) : (
                      <span key={i}>{content}</span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
