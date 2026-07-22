"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface CareerFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  skill: string;
  degree_level: string;
  demand_level: string;
  min_salary: string;
  max_salary: string;
  sort_by: string;
  sort_order: "asc" | "desc";
}

const emptyFilters: FilterState = {
  skill: "",
  degree_level: "",
  demand_level: "",
  min_salary: "",
  max_salary: "",
  sort_by: "title",
  sort_order: "asc",
};

export default function CareerFilters({ onSearch, onFilterChange }: CareerFiltersProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeFilterCount = Object.values(filters).filter((v) => v && v !== "title" && v !== "asc").length;

  const updateFilter = (key: keyof FilterState, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilterChange(next);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setQuery("");
    onSearch("");
    onFilterChange(emptyFilters);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a5a6a]" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch(e.target.value);
            }}
            placeholder="Search careers by title or description..."
            className="w-full rounded-lg border border-[#1E4FA3]/15 bg-[#0d214f]/30 py-2.5 pl-10 pr-4 text-sm text-[#f0f0f0] placeholder:text-[#5a5a6a] focus:border-[#1E4FA3] focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
            showAdvanced || activeFilterCount > 0
              ? "border-[#1E4FA3]/40 bg-[#1E4FA3]/15 text-[#1E4FA3]"
              : "border-[#1E4FA3]/15 bg-transparent text-[#8a8a9a] hover:bg-[#0d214f]/30"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-[#1E4FA3] px-1.5 py-0.5 text-[10px] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-[#1E4FA3]/15 px-3 py-2.5 text-[#5a5a6a] hover:bg-[#0d214f]/30 hover:text-[#f0f0f0]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="grid gap-3 rounded-lg border border-[#1E4FA3]/15 bg-[#0d214f]/30 p-4 md:grid-cols-3 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5a5a6a]">Skill</label>
            <input
              type="text"
              value={filters.skill}
              onChange={(e) => updateFilter("skill", e.target.value)}
              placeholder="e.g. Python"
              className="w-full rounded border border-[#1E4FA3]/15 bg-[#0a0a0f]/60 px-2.5 py-1.5 text-sm text-[#f0f0f0] placeholder:text-[#5a5a6a] focus:border-[#1E4FA3] focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5a5a6a]">Degree Level</label>
            <select
              value={filters.degree_level}
              onChange={(e) => updateFilter("degree_level", e.target.value)}
              className="w-full rounded border border-[#1E4FA3]/15 bg-[#0a0a0f]/60 px-2.5 py-1.5 text-sm text-[#f0f0f0] focus:border-[#1E4FA3] focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]"
            >
              <option value="">Any</option>
              <option value="high_school">High School</option>
              <option value="bachelor">Bachelor&apos;s</option>
              <option value="master">Master&apos;s</option>
              <option value="phd">PhD</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5a5a6a]">Demand Level</label>
            <select
              value={filters.demand_level}
              onChange={(e) => updateFilter("demand_level", e.target.value)}
              className="w-full rounded border border-[#1E4FA3]/15 bg-[#0a0a0f]/60 px-2.5 py-1.5 text-sm text-[#f0f0f0] focus:border-[#1E4FA3] focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]"
            >
              <option value="">Any</option>
              <option value="very_high">Very High</option>
              <option value="high">High</option>
              <option value="above_average">Above Average</option>
              <option value="average">Average</option>
              <option value="below_average">Below Average</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5a5a6a]">Min Salary</label>
            <input
              type="number"
              value={filters.min_salary}
              onChange={(e) => updateFilter("min_salary", e.target.value)}
              placeholder="0"
              className="w-full rounded border border-[#1E4FA3]/15 bg-[#0a0a0f]/60 px-2.5 py-1.5 text-sm text-[#f0f0f0] placeholder:text-[#5a5a6a] focus:border-[#1E4FA3] focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5a5a6a]">Max Salary</label>
            <input
              type="number"
              value={filters.max_salary}
              onChange={(e) => updateFilter("max_salary", e.target.value)}
              placeholder="999999"
              className="w-full rounded border border-[#1E4FA3]/15 bg-[#0a0a0f]/60 px-2.5 py-1.5 text-sm text-[#f0f0f0] placeholder:text-[#5a5a6a] focus:border-[#1E4FA3] focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
