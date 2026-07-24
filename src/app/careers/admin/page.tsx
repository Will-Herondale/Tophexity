"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCareers, importCareers, updateCareer, deleteCareer } from "@/lib/api";
import type { Career, CareerSearchParams } from "@/types/career";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  ArrowLeft, Upload, Search, Edit3, Trash2, Loader2, Plus, X,
  Briefcase, DollarSign, TrendingUp, BarChart3,
} from "lucide-react";
import { VALID_DEMAND_LEVELS, VALID_GROWTH_OUTLOOKS } from "@/lib/constants";

export default function CareersAdminPage() {
  const router = useRouter();

  // List state
  const [careers, setCareers] = useState<Career[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Import state
  const [importJson, setImportJson] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState<Career | null>(null);
  const [editForm, setEditForm] = useState({
    title: "", description: "", average_salary: "",
    growth_outlook: "", demand_level: "",
    required_education: "", typical_skills: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState<Career | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const fetchCareers = useCallback(async () => {
    setLoading(true);
    try {
      const params: CareerSearchParams = { page, page_size: 20, sort_by: "title", sort_order: "asc" };
      if (searchTerm) params.search = searchTerm;
      const data = await getCareers(params);
      const seen = new Set<string>();
      const unique = (data.items || []).filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
      setCareers(unique);
      setTotal(data.total || 0);
    } catch {} finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => { fetchCareers(); }, [fetchCareers]);

  // Import
  const handleImport = async () => {
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const parsed = JSON.parse(importJson);
      const items = Array.isArray(parsed) ? parsed : parsed.careers || [parsed];
      const result = await importCareers(items);
      setImportResult({ imported: result.imported || 0, skipped: result.skipped || 0 });
      setImportJson("");
      fetchCareers();
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Invalid JSON");
    } finally {
      setImporting(false);
    }
  };

  // Edit
  const openEdit = (career: Career) => {
    setEditing(career);
    setEditForm({
      title: career.title,
      description: career.description || "",
      average_salary: career.average_salary?.toString() || "",
      growth_outlook: career.growth_outlook || "",
      demand_level: career.demand_level || "",
      required_education: career.required_education ? JSON.stringify(career.required_education) : "",
      typical_skills: career.typical_skills ? JSON.stringify(career.typical_skills) : "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (editForm.title) payload.title = editForm.title;
      if (editForm.description) payload.description = editForm.description;
      if (editForm.average_salary) payload.average_salary = parseFloat(editForm.average_salary);
      if (editForm.growth_outlook) payload.growth_outlook = editForm.growth_outlook;
      if (editForm.demand_level) payload.demand_level = editForm.demand_level;
      if (editForm.required_education) payload.required_education = JSON.parse(editForm.required_education);
      if (editForm.typical_skills) payload.typical_skills = JSON.parse(editForm.typical_skills);
      await updateCareer(editing.id, payload);
      setEditing(null);
      fetchCareers();
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await deleteCareer(deleting.id);
      setDeleting(null);
      fetchCareers();
    } catch {} finally {
      setDeletingBusy(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => router.push("/careers")} className="p-2 rounded-lg hover:bg-surface/40 text-text-secondary hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">Career Admin</h1>
          <p className="mt-1 text-sm text-text-secondary">Import, edit, and manage career entries</p>
        </div>
      </div>

      {/* Import Section */}
      <Card className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-foreground font-[family-name:var(--font-display)] flex items-center gap-2">
          <Upload className="h-4 w-4 text-accent" />
          Import Careers
        </h3>
        <p className="text-xs text-text-secondary mb-3">Paste JSON array of career objects or a file with a <code className="text-accent">careers</code> key.</p>
        <textarea
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder='[{"title": "Software Engineer", "description": "...", "average_salary": 120000, ...}]'
          className="w-full h-40 rounded-lg border border-border bg-background/50 p-3 text-xs text-foreground font-mono placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
        />
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={handleImport} disabled={!importJson.trim() || importing}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Upload className="h-4 w-4 mr-1.5" />}
            Import
          </Button>
          {importResult && (
            <span className="text-xs text-emerald-400">Imported {importResult.imported}, Skipped {importResult.skipped}</span>
          )}
          {importError && (
            <span className="text-xs text-red-400">{importError}</span>
          )}
        </div>
      </Card>

      {/* List Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground font-[family-name:var(--font-display)] flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-accent" />
            All Careers ({total})
          </h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Search..."
              className="rounded-lg border border-border bg-background/50 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none w-48"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
        ) : careers.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-12">No careers found. Import some careers above.</p>
        ) : (
          <>
            <div className="space-y-2">
              {careers.map((career) => (
                <div key={career.id} className="flex items-center justify-between rounded-xl border border-border bg-background/30 p-3 hover:border-border-light transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{career.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {career.average_salary && (
                        <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                          <DollarSign className="h-2.5 w-2.5" />${(career.average_salary / 1000).toFixed(0)}k
                        </span>
                      )}
                      {career.demand_level && (
                        <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                          <BarChart3 className="h-2.5 w-2.5" />{career.demand_level}
                        </span>
                      )}
                      {career.growth_outlook && (
                        <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                          <TrendingUp className="h-2.5 w-2.5" />{career.growth_outlook}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3">
                    <button onClick={() => openEdit(career)} className="p-1.5 rounded-lg text-text-muted hover:bg-accent/10 hover:text-accent transition-colors">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleting(career)} className="p-1.5 rounded-lg text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <span className="text-xs text-text-secondary">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Edit Modal */}
      {editing && (
        <Modal isOpen onClose={() => setEditing(null)} title="Edit Career">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Title</label>
              <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Description</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Avg Salary ($)</label>
                <input type="number" value={editForm.average_salary} onChange={(e) => setEditForm({ ...editForm, average_salary: e.target.value })} className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Demand Level</label>
                <select value={editForm.demand_level} onChange={(e) => setEditForm({ ...editForm, demand_level: e.target.value })} className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                  <option value="">Select...</option>
                  {VALID_DEMAND_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Growth Outlook</label>
              <select value={editForm.growth_outlook} onChange={(e) => setEditForm({ ...editForm, growth_outlook: e.target.value })} className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                <option value="">Select...</option>
                {VALID_GROWTH_OUTLOOKS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Required Education (JSON)</label>
              <input value={editForm.required_education} onChange={(e) => setEditForm({ ...editForm, required_education: e.target.value })} placeholder='{"degree": "bachelor"}' className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs text-foreground font-mono focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Typical Skills (JSON)</label>
              <input value={editForm.typical_skills} onChange={(e) => setEditForm({ ...editForm, typical_skills: e.target.value })} placeholder='{"python": "required"}' className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs text-foreground font-mono focus:border-accent focus:outline-none" />
            </div>
          </div>
          {importError && <p className="text-xs text-red-400 mt-3">{importError}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setEditing(null); setImportError(null); }}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleting && (
        <Modal isOpen onClose={() => setDeleting(null)} title="Delete Career">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <strong className="text-foreground">{deleting.title}</strong>? This will remove all associated skills, degrees, colleges, and resources. This cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deletingBusy}>
              {deletingBusy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
