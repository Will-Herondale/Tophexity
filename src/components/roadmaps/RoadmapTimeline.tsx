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
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-indigo-100 dark:bg-indigo-900/30" />
      <div className="space-y-6">
          {sorted.map((step) => (
          <div key={step.id} className="relative flex gap-4">
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
              {step.step_order}
            </div>
            <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{step.title}</h4>
              {step.description && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{step.description}</p>}
              {step.duration_months && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <Clock className="h-3 w-3" /> {step.duration_months} month{step.duration_months !== 1 ? "s" : ""}
                </span>
              )}
              {step.resources && Object.keys(step.resources).length > 0 && (
                <div className="mt-2">
                  {Object.entries(step.resources).map(([key, value]) => (
                    <div key={key} className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{key}:</span>{" "}
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
