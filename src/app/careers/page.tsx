"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCareers } from "@/lib/api";
import type { Career, CareerSearchParams } from "@/types/career";
import CareerCard from "@/components/careers/CareerCard";
import CareerDetailModal from "@/components/careers/CareerDetailModal";
import CareerFilters, { type FilterState } from "@/components/careers/CareerFilters";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { usePageTitle } from "@/hooks/usePageTitle";
import Link from "next/link";
import { Briefcase, Shield, Heart, CheckSquare, Sparkles, X } from "lucide-react";

export default function CareersPage() {
  usePageTitle("Careers");
  const { user } = useAuth();
  const router = useRouter();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [careers, setCareers] = useState<Career[]>([]);
  const [allCareers, setAllCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    skill: "",
    degree_level: "",
    experience_level: "",
    demand_level: "",
    min_salary: "",
    max_salary: "",
    sort_by: "title",
    sort_order: "asc",
  });
  const [detailCareerId, setDetailCareerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "saved">("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const params: CareerSearchParams = {
      page,
      page_size: 20,
      sort_by: filters.sort_by || "title",
      sort_order: filters.sort_order,
    };
    if (searchQuery) params.search = searchQuery;
    if (filters.skill) params.skill = filters.skill;
    if (filters.degree_level) params.degree_level = filters.degree_level;
    if (filters.demand_level) params.demand_level = filters.demand_level;
    if (filters.min_salary) params.min_salary = Number(filters.min_salary);
    if (filters.max_salary) params.max_salary = Number(filters.max_salary);

    getCareers(params)
      .then((data) => {
        if (!cancelled) {
          const seen = new Set<string>();
          const unique = data.items.filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
          setCareers(unique);
          setAllCareers((prev) => {
            const merged = new Map(prev.map((c) => [c.id, c]));
            unique.forEach((c) => merged.set(c.id, c));
            return Array.from(merged.values());
          });
          setTotalPages(data.total_pages);
          setTotal(data.total);
        }
      })
      .catch(() => { if (!cancelled) setFetchError("Failed to load careers"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, searchQuery, filters]);

  const savedCareers = useMemo(
    () => allCareers.filter((c) => favorites.includes(c.id)),
    [allCareers, favorites]
  );

  const displayCareers = activeTab === "saved" ? savedCareers : careers;

  const handleSearch = (query: string) => { setSearchQuery(query); setPage(1); };
  const handleFilterChange = (f: FilterState) => { setFilters(f); setPage(1); };

  const handleAskAI = (career: Career) => {
    router.push(`/chat?career=${career.id}`);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCompare = () => {
    const ids = Array.from(selectedIds).join(",");
    router.push(`/chat?compare=${ids}`);
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const detailCareer = detailCareerId ? careers.find((c) => c.id === detailCareerId) || savedCareers.find((c) => c.id === detailCareerId) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">Explore Careers</h1>
          <p className="mt-1 text-sm text-text-secondary">{total > 0 ? `${total} careers available` : "Discover career paths"}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <span className="text-xs text-text-secondary">{selectedIds.size} selected</span>
              <Button variant="outline" size="sm" onClick={handleCancelSelect}>
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button size="sm" disabled={selectedIds.size < 2} onClick={handleCompare}>
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Compare {selectedIds.size > 0 && `(${selectedIds.size})`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectMode(true)}>
                <CheckSquare className="h-3.5 w-3.5 mr-1" />
                Select
              </Button>
              {user && (
                <Link href="/careers/admin">
                  <Button variant="outline" size="sm">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    Admin
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-border bg-surface/20 p-1">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "all" ? "bg-accent text-white" : "text-text-secondary hover:text-foreground"
          }`}
        >
          <Briefcase className="mr-1.5 inline h-3.5 w-3.5" />
          All Careers
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "saved" ? "bg-accent text-white" : "text-text-secondary hover:text-foreground"
          }`}
        >
          <Heart className="mr-1.5 inline h-3.5 w-3.5" />
          Saved ({favorites.length})
        </button>
      </div>

      {activeTab === "all" && (
        <div className="mb-6">
          <CareerFilters onSearch={handleSearch} onFilterChange={handleFilterChange} />
        </div>
      )}

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {fetchError}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-light border-t-accent" />
        </div>
      ) : displayCareers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border-light bg-surface/30 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            {activeTab === "saved" ? (
              <Heart className="h-8 w-8 text-text-muted" />
            ) : (
              <Briefcase className="h-8 w-8 text-text-muted" />
            )}
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
            {activeTab === "saved" ? "No saved careers" : "No careers found"}
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            {activeTab === "saved"
              ? "Tap the heart icon on any career to save it here."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {displayCareers.map((career) => (
              <CareerCard
                key={career.id}
                career={career}
                onViewDetails={(c) => setDetailCareerId(c.id)}
                isFavorited={isFavorite(career.id)}
                onToggleFavorite={toggleFavorite}
                onAskAI={handleAskAI}
                selectable={selectMode}
                selected={selectedIds.has(career.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
          {activeTab === "all" && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {detailCareerId && (
        <CareerDetailModal
          careerId={detailCareerId}
          onClose={() => setDetailCareerId(null)}
          isFavorited={isFavorite(detailCareerId)}
          onToggleFavorite={toggleFavorite}
          onAskAI={(id) => handleAskAI({ id } as Career)}
        />
      )}
    </div>
  );
}
