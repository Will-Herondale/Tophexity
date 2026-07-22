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
              {step.resources && Object.keys(step.resources).length > 0 && (
                <div className="mt-2">
                  {Object.entries(step.resources).map(([key, value]) => (
                    <div key={key} className="text-xs" style={{ color: "#8a8a9a" }}>
                      <span className="font-medium" style={{ color: "#f0f0f0" }}>{key}:</span>{" "}
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
