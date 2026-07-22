"use client";

import { useState, useEffect } from "react";
import { getCareers } from "@/lib/api";
import type { Career, CareerSearchParams } from "@/types/career";
import CareerCard from "@/components/careers/CareerCard";
import CareerDetailModal from "@/components/careers/CareerDetailModal";
import CareerFilters, { type FilterState } from "@/components/careers/CareerFilters";
import Button from "@/components/ui/Button";
import { Briefcase } from "lucide-react";

export default function CareersPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    skill: "",
    degree_level: "",
    demand_level: "",
    min_salary: "",
    max_salary: "",
    sort_by: "title",
    sort_order: "asc",
  });
  const [detailCareerId, setDetailCareerId] = useState<string | null>(null);

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
        if (!cancelled) { setCareers(data.items); setTotalPages(data.total_pages); setTotal(data.total); }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, searchQuery, filters]);

  const handleSearch = (query: string) => { setSearchQuery(query); setPage(1); };
  const handleFilterChange = (f: FilterState) => { setFilters(f); setPage(1); };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#f0f0f0]">Explore Careers</h1>
        <p className="mt-1 text-sm text-[#8a8a9a]">{total > 0 ? `${total} careers available` : "Discover career paths"}</p>
      </div>

      <div className="mb-6">
        <CareerFilters onSearch={handleSearch} onFilterChange={handleFilterChange} />
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E4FA3]/30 border-t-[#1E4FA3]" />
        </div>
      ) : careers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#1E4FA3]/20 bg-[#0d214f]/30 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1E4FA3]/10">
            <Briefcase className="h-8 w-8 text-[#5a5a6a]" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#f0f0f0]">No careers found</h3>
          <p className="mt-2 text-sm text-[#8a8a9a]">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {careers.map((career) => (
              <CareerCard key={career.id} career={career} onViewDetails={(c) => setDetailCareerId(c.id)} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-[#8a8a9a]">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {detailCareerId && <CareerDetailModal careerId={detailCareerId} onClose={() => setDetailCareerId(null)} />}
    </div>
  );
}
