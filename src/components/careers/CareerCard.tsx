"use client";

import { useState } from "react";
import type { Career } from "@/types/career";
import Card from "@/components/ui/Card";
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, Briefcase } from "lucide-react";

const demandColors: Record<string, string> = {
  very_high: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  high: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  above_average: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  average: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  below_average: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  low: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

const growthColors: Record<string, string> = {
  excellent: "text-green-600 dark:text-green-400",
  high: "text-green-600 dark:text-green-400",
  above_average: "text-blue-600 dark:text-blue-400",
  average: "text-gray-500 dark:text-gray-400",
  below_average: "text-amber-600 dark:text-amber-400",
  declining: "text-red-600 dark:text-red-400",
};

interface CareerCardProps {
  career: Career;
  onViewDetails: (career: Career) => void;
}

export default function CareerCard({ career, onViewDetails }: CareerCardProps) {
  const [expanded, setExpanded] = useState(false);

  const educationText = career.required_education
    ? Object.entries(career.required_education).map(([k, v]) => `${k}: ${v}`).join(", ")
    : null;

  const skillsText = career.typical_skills
    ? Object.keys(career.typical_skills).join(", ")
    : null;

  return (
    <Card className="transition-all">
      <div className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{career.title}</h3>
            {career.description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2 dark:text-gray-400">{career.description}</p>
            )}
          </div>
          <span className="ml-2 text-gray-400 dark:text-gray-500">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {career.demand_level && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${demandColors[career.demand_level] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
              {career.demand_level.replace("_", " ")} demand
            </span>
          )}
          {career.growth_outlook && (
            <span className={`flex items-center gap-1 text-xs ${growthColors[career.growth_outlook] || "text-gray-500 dark:text-gray-400"}`}>
              <TrendingUp className="h-3 w-3" />
              {career.growth_outlook.replace("_", " ")} growth
            </span>
          )}
          {career.average_salary && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <DollarSign className="h-3 w-3" />
              ${(career.average_salary / 1000).toFixed(0)}k avg
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
          {career.description && (
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{career.description}</p>
          )}
          {educationText && (
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              <Briefcase className="mr-1 inline h-3 w-3" />
              Typical education: {educationText}
            </p>
          )}
          {skillsText && (
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Typical skills: {skillsText}</p>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(career);
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            View Full Details
          </button>
        </div>
      )}
    </Card>
  );
}
