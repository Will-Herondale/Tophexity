"use client";

import type { Roadmap } from "@/types/roadmap";
import Card from "@/components/ui/Card";
import { Map, ChevronRight, Clock, Calendar } from "lucide-react";

interface RoadmapCardProps {
  roadmap: Roadmap;
  onClick: (id: string) => void;
}

export default function RoadmapCard({ roadmap, onClick }: RoadmapCardProps) {
  return (
    <Card hover onClick={() => onClick(roadmap.id)} className="cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {roadmap.title || "Learning Roadmap"}
          </h3>
          {roadmap.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">{roadmap.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(roadmap.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Map className="h-3 w-3" />
              {roadmap.steps.length} step{roadmap.steps.length !== 1 ? "s" : ""}
            </span>
            {roadmap.estimated_duration_months && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {roadmap.estimated_duration_months} months
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
      </div>
    </Card>
  );
}
