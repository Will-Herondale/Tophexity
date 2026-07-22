"use client";

import type { PortfolioItem } from "@/types/portfolio";
import { PORTFOLIO_ITEM_TYPES } from "@/lib/constants";
import Card from "@/components/ui/Card";
import { ExternalLink, Edit3, Trash2 } from "lucide-react";

function getTypeBadge(type: string) {
  const colors: Record<string, string> = {
    project: "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    hackathon: "bg-purple-50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    competition: "bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    certificate: "bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    research: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
    internship: "bg-amber-50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    olympiad: "bg-pink-50 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
    leadership: "bg-teal-50 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
    volunteering: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
    achievement: "bg-orange-50 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  };
  const label = PORTFOLIO_ITEM_TYPES.find((t) => t.value === type)?.label || type;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[type] || "bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
      {label}
    </span>
  );
}

interface PortfolioItemCardProps {
  item: PortfolioItem;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
}

export default function PortfolioItemCard({ item, onEdit, onDelete }: PortfolioItemCardProps) {
  return (
    <Card className="group relative">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
            {getTypeBadge(item.item_type)}
          </div>
          {item.description && (
            <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">{item.description}</p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <ExternalLink className="h-3 w-3" />
              View link
            </a>
          )}
          {item.skills_used && Object.keys(item.skills_used).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.keys(item.skills_used).map((skill) => (
                <span key={skill} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="ml-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(item)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(item)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
