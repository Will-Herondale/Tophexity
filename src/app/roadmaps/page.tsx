"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getRoadmapsHistory, generateRoadmap, getCareers } from "@/lib/api";
import type { Roadmap } from "@/types/roadmap";
import type { Career } from "@/types/career";
import RoadmapCard from "@/components/roadmaps/RoadmapCard";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Map, RefreshCw, Sparkles, Search } from "lucide-react";

export default function RoadmapsPage() {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Career picker modal
  const [modalOpen, setModalOpen] = useState(false);
  const [careerSearch, setCareerSearch] = useState("");
  const [careerResults, setCareerResults] = useState<Career[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const fetchRoadmaps = useCallback((p: number) => {
    setLoading(true);
    getRoadmapsHistory(p)
      .then((data) => { setRoadmaps(data.items); setTotalPages(data.total_pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getRoadmapsHistory(page)
      .then((data) => { if (!cancelled) { setRoadmaps(data.items); setTotalPages(data.total_pages); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  const searchCareers = async (query: string) => {
    setCareerSearch(query);
    if (query.trim().length < 2) { setCareerResults([]); return; }
    setSearching(true);
    try {
      const data = await getCareers({ search: query, page: 1, page_size: 10 });
      setCareerResults(data.items || []);
    } catch { setCareerResults([]); }
    finally { setSearching(false); }
  };

  const handleGenerate = async () => {
    if (!selectedCareer) return;
    setGenerating(true);
    setGenError(null);
    try {
      await generateRoadmap({ career_id: selectedCareer.id });
      setModalOpen(false);
      setSelectedCareer(null);
      setCareerSearch("");
      setCareerResults([]);
      fetchRoadmaps(1);
      setPage(1);
    } catch (err: any) {
      setGenError(err?.response?.data?.detail || err?.message || "Failed to generate roadmap");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 bg-background">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">Learning Roadmaps</h1>
          <p className="mt-1 text-sm text-text-secondary">Step-by-step plans for your career path</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchRoadmaps(page)} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Sparkles className="mr-1 h-4 w-4" /> Generate Roadmap
          </Button>
        </div>
      </div>

      {genError && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {genError}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-light border-t-accent" />
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface/80">
            <Map className="h-8 w-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] text-foreground">No roadmaps yet</h3>
          <p className="mt-2 text-sm text-text-secondary">Pick a career and let AI generate a personalized learning roadmap for you.</p>
          <Button className="mt-6" onClick={() => setModalOpen(true)}>
            <Sparkles className="mr-1.5 h-4 w-4" /> Generate Roadmap
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {roadmaps.map((rm) => (
              <RoadmapCard key={rm.id} roadmap={rm} onClick={(id) => router.push(`/roadmaps/${id}`)} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {/* Career Picker Modal */}
      <Modal isOpen={modalOpen} onClose={() => { if (!generating) { setModalOpen(false); setSelectedCareer(null); setCareerSearch(""); setCareerResults([]); setGenError(null); } }} title="Generate Learning Roadmap" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Search for a career, select it, and AI will generate a step-by-step learning roadmap.</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search careers..."
              value={careerSearch}
              onChange={(e) => searchCareers(e.target.value)}
              className="block w-full rounded-lg border border-border bg-surface/30 py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-text-muted focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          {searching && <div className="flex justify-center py-2"><div className="h-6 w-6 animate-spin rounded-full border-2 border-border-light border-t-accent" /></div>}

          {careerResults.length > 0 && (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {careerResults.map((career) => (
                <button
                  key={career.id}
                  onClick={() => setSelectedCareer(career)}
                  className={`block w-full rounded-lg border p-3 text-left transition-colors ${selectedCareer?.id === career.id ? "border-accent bg-accent/10" : "border-border bg-surface/30 hover:border-accent/40"}`}
                >
                  <div className="font-medium text-sm text-foreground">{career.title}</div>
                  <div className="mt-0.5 text-xs text-text-secondary line-clamp-2">{career.description}</div>
                </button>
              ))}
            </div>
          )}

          {selectedCareer && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
              <p className="text-xs font-medium text-text-secondary">Selected Career</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{selectedCareer.title}</p>
            </div>
          )}

          {genError && <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">{genError}</div>}

          {generating && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-center">
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-accent animate-pulse" />
              <p className="text-sm text-foreground">AI is generating your roadmap...</p>
              <p className="mt-0.5 text-xs text-text-secondary">This can take 30-60 seconds</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { if (!generating) { setModalOpen(false); setSelectedCareer(null); setCareerSearch(""); setCareerResults([]); setGenError(null); } }} disabled={generating}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={!selectedCareer || generating}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              {generating ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}