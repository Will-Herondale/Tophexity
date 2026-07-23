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
  experience_level: string;
  demand_level: string;
  min_salary: string;
  max_salary: string;
  sort_by: string;
  sort_order: "asc" | "desc";
}

const emptyFilters: FilterState = {
  skill: "",
  degree_level: "",
  experience_level: "",
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch(e.target.value);
            }}
            placeholder="Search careers by title or description..."
            className="w-full rounded-lg border border-border bg-surface/30 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
            showAdvanced || activeFilterCount > 0
              ? "border-accent/40 bg-accent/15 text-accent"
              : "border-border bg-transparent text-text-secondary hover:bg-surface/30"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-border px-3 py-2.5 text-text-muted hover:bg-surface/30 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="grid gap-3 rounded-lg border border-border bg-surface/30 p-4 md:grid-cols-3 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Skill</label>
            <input
              type="text"
              value={filters.skill}
              onChange={(e) => updateFilter("skill", e.target.value)}
              placeholder="e.g. Python"
              className="w-full rounded border border-border bg-background/60 px-2.5 py-1.5 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Experience Level</label>
            <select
              value={filters.experience_level}
              onChange={(e) => updateFilter("experience_level", e.target.value)}
              className="w-full rounded border border-border bg-background/60 px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Any</option>
              <option value="student">Student</option>
              <option value="entry">Entry Level (0-2 yrs)</option>
              <option value="mid">Mid Level (3-7 yrs)</option>
              <option value="senior">Senior (8-15 yrs)</option>
              <option value="executive">Executive (15+ yrs)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Degree Level</label>
            <select
              value={filters.degree_level}
              onChange={(e) => updateFilter("degree_level", e.target.value)}
              className="w-full rounded border border-border bg-background/60 px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Any</option>
              <option value="high_school">High School</option>
              <option value="bachelor">Bachelor&apos;s</option>
              <option value="master">Master&apos;s</option>
              <option value="phd">PhD</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Demand Level</label>
            <select
              value={filters.demand_level}
              onChange={(e) => updateFilter("demand_level", e.target.value)}
              className="w-full rounded border border-border bg-background/60 px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
            <label className="mb-1 block text-xs font-medium text-text-muted">Min Salary</label>
            <input
              type="number"
              value={filters.min_salary}
              onChange={(e) => updateFilter("min_salary", e.target.value)}
              placeholder="0"
              className="w-full rounded border border-border bg-background/60 px-2.5 py-1.5 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Max Salary</label>
            <input
              type="number"
              value={filters.max_salary}
              onChange={(e) => updateFilter("max_salary", e.target.value)}
              placeholder="999999"
              className="w-full rounded border border-border bg-background/60 px-2.5 py-1.5 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
