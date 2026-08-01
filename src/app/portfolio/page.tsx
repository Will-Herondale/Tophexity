"use client";

import { useState, useEffect } from "react";
import { getPortfolioItems, createPortfolioItem, updatePortfolioItem, deletePortfolioItem } from "@/lib/api";
import type { PortfolioItem, PortfolioItemCreatePayload } from "@/types/portfolio";
import { PORTFOLIO_ITEM_TYPES } from "@/lib/constants";
import PortfolioGrid from "@/components/portfolio/PortfolioGrid";
import PortfolioItemForm from "@/components/portfolio/PortfolioItemForm";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Plus, FolderOpen, Search } from "lucide-react";

export default function PortfolioPage() {
  usePageTitle("Portfolio");
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PortfolioItem | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const params: { page: number; page_size: number; item_type?: string } = { page, page_size: 12 };
    if (filter) params.item_type = filter;
    getPortfolioItems(params)
      .then((data) => { if (!cancelled) { setFetchError(null); setItems(data.items); setTotalPages(data.total_pages); } })
      .catch(() => { if (!cancelled) setFetchError("Failed to load portfolio items"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, filter]);

  const refetch = () => {
    const params: { page: number; page_size: number; item_type?: string } = { page, page_size: 12 };
    if (filter) params.item_type = filter;
    getPortfolioItems(params).then((data) => { setItems(data.items); setTotalPages(data.total_pages); });
  };

  const handleSave = async (payload: PortfolioItemCreatePayload) => {
    if (editItem) await updatePortfolioItem(editItem.id, payload);
    else await createPortfolioItem(payload);
    refetch();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deletePortfolioItem(deleteConfirm.id);
    setDeleteConfirm(null);
    refetch();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">My Portfolio</h1>
          <p className="mt-1 text-sm text-text-muted">{items.length} item{items.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => { setFilter(""); setPage(1); }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            !filter
              ? "bg-accent text-white shadow-sm"
              : "bg-surface/30 text-text-muted hover:bg-surface/50 hover:text-text-secondary"
          }`}>
          {!filter && <Search className="h-3 w-3" />}
          All
        </button>
        {PORTFOLIO_ITEM_TYPES.map((type) => (
          <button key={type.value} onClick={() => { setFilter(type.value); setPage(1); }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              filter === type.value
                ? "bg-accent text-white shadow-sm"
                : "bg-surface/30 text-text-muted hover:bg-surface/50 hover:text-text-secondary"
            }`}>
            {type.label}
          </button>
        ))}
      </div>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {fetchError}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-light border-t-accent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border-light bg-surface/20 p-16 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <FolderOpen className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] text-foreground">
            {filter ? "No matching items" : "No portfolio items yet"}
          </h3>
          <p className="mt-2 max-w-sm mx-auto text-sm text-text-muted">
            {filter
              ? `No items with type "${PORTFOLIO_ITEM_TYPES.find(t => t.value === filter)?.label}". Try a different filter.`
              : "Start showcasing your projects, achievements, and experience."}
          </p>
          <Button className="mt-6" onClick={() => { setEditItem(null); setShowForm(true); }}>
            <Plus className="mr-1 h-4 w-4" /> {filter ? "Add Item Instead" : "Add Your First Item"}
          </Button>
        </div>
      ) : (
        <>
          <PortfolioGrid items={items} onEdit={(item) => { setEditItem(item); setShowForm(true); }} onDelete={setDeleteConfirm} />
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`h-7 min-w-[28px] rounded-md text-xs font-medium transition-colors ${
                      p === page
                        ? "bg-accent text-white"
                        : "bg-surface/20 text-text-muted hover:bg-surface/40 hover:text-text-secondary"
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <PortfolioItemForm item={editItem || undefined} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />
      )}

      {deleteConfirm && (
        <Modal isOpen onClose={() => setDeleteConfirm(null)} title="Delete Item" size="sm">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <strong className="text-foreground">{deleteConfirm.title}</strong>? This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
