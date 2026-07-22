"use client";

import { useState, useEffect } from "react";
import { getPortfolioItems, createPortfolioItem, updatePortfolioItem, deletePortfolioItem } from "@/lib/api";
import type { PortfolioItem, PortfolioItemCreatePayload } from "@/types/portfolio";
import { PORTFOLIO_ITEM_TYPES } from "@/lib/constants";
import PortfolioGrid from "@/components/portfolio/PortfolioGrid";
import PortfolioItemForm from "@/components/portfolio/PortfolioItemForm";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Plus, FolderOpen } from "lucide-react";

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
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
      .then((data) => { if (!cancelled) { setItems(data.items); setTotalPages(data.total_pages); } })
      .catch(() => {})
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Portfolio</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{items.length} items</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => { setFilter(""); setPage(1); }}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${!filter ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"}`}>
          All
        </button>
        {PORTFOLIO_ITEM_TYPES.map((type) => (
          <button key={type.value} onClick={() => { setFilter(type.value); setPage(1); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === type.value ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"}`}>
            {type.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-700 dark:border-t-indigo-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <FolderOpen className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No portfolio items yet</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Start showcasing your projects, achievements, and experience.</p>
          <Button className="mt-6" onClick={() => { setEditItem(null); setShowForm(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Add Your First Item
          </Button>
        </div>
      ) : (
        <>
          <PortfolioGrid items={items} onEdit={(item) => { setEditItem(item); setShowForm(true); }} onDelete={setDeleteConfirm} />
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="flex items-center px-3 text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <PortfolioItemForm item={editItem || undefined} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />
      )}

      {deleteConfirm && (
        <Modal isOpen onClose={() => setDeleteConfirm(null)} title="Delete Item">
          <p className="text-sm text-gray-600 dark:text-gray-300">Are you sure you want to delete <strong>{deleteConfirm.title}</strong>?</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
