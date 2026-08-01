"use client";

import { useState, useEffect, useCallback } from "react";
import { getDbOverview } from "@/lib/api";
import type { DbOverview, DbTableInfo } from "@/types/system";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Database, RefreshCw, Table2, AlertTriangle } from "lucide-react";

function renderValue(v: unknown): React.ReactNode {
  if (v === null || v === undefined) return <span className="text-text-muted">NULL</span>;
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  return s.length > 120 ? s.slice(0, 120) + "…" : s;
}

function TableCard({ table, open }: { table: DbTableInfo; open: boolean }) {
  const [expanded, setExpanded] = useState(open);
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-surface/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/15 p-2">
            <Table2 className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground font-mono">{table.table}</p>
            <p className="text-xs text-text-muted">{table.rows.toLocaleString()} rows · {table.columns.length} columns</p>
          </div>
        </div>
        <span className="text-xs text-text-muted">{expanded ? "collapse" : "expand"}</span>
      </button>

      {expanded && (
        <div className="border-t border-border/50 p-4">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {table.columns.map((c) => (
              <span key={c.name} className="rounded-md bg-surface/40 px-2 py-0.5 font-mono text-[11px] text-text-secondary">
                {c.name}<span className="text-text-muted">:{c.type}</span>
              </span>
            ))}
          </div>

          {table.sample.length === 0 ? (
            <p className="text-xs text-text-muted">No rows</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    {table.columns.map((c) => (
                      <th key={c.name} className="py-1.5 pr-4 font-semibold text-text-secondary">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.sample.map((row, i) => (
                    <tr key={i} className="border-b border-border/30 last:border-0">
                      {table.columns.map((c) => (
                        <td key={c.name} className="py-1.5 pr-4 font-mono text-text-secondary">
                          {renderValue(row[c.name])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function DbViewerPage() {
  usePageTitle("DB Viewer");
  const [data, setData] = useState<DbOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await getDbOverview();
    setData(d);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDbOverview()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => {
        if (!cancelled) {
          const e = err as { response?: { data?: { detail?: string } }; message?: string };
          setError(e?.response?.data?.detail || e?.message || "Failed to load database overview");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    load().catch((err) => {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e?.response?.data?.detail || e?.message || "Failed to load database overview");
    }).finally(() => setLoading(false));
  };

  const totalRows = data?.tables.reduce((acc, t) => acc + t.rows, 0) ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-accent" />
            Database Viewer
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Read-only view of the live database
            {data && (
              <> · {data.total_tables} tables · {totalRows.toLocaleString()} rows total · refreshed {new Date(data.generated_at).toLocaleTimeString()}</>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-light border-t-accent" />
        </div>
      ) : data ? (
        <div className="space-y-3">
          {data.tables.map((t) => (
            <TableCard key={t.table} table={t} open={t.rows > 0} />
          ))}
        </div>
      ) : (
        !error && <p className="text-sm text-text-muted">No data</p>
      )}
    </div>
  );
}
