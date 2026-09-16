import { useEffect, useState } from "react";
import { bulkSetStatus } from "@/api/client";
import { AssetDetail } from "@/features/assets/AssetDetail";
import { AssetGrid } from "@/features/assets/AssetGrid";
import { useAssets } from "@/features/assets/useAssets";
import { statusLabel } from "@/lib/format";
import type { Asset, AssetStatus, AssetQuery } from "@/lib/types";
import useDebounce from "./hooks/useDebounce";
import { getInitialQueryFromUrl } from "./utils/queryParams";
import { SORTS, STATUSES } from "./constants/assets.constants";

export function App() {
  const [initialQuery] = useState(getInitialQueryFromUrl());
  console.log("initialQuery", initialQuery);
  const [q, setQ] = useState(initialQuery.q);
  const [conditionedQ, setConditionedQ] = useState(initialQuery.q);
  const [status, setStatus] = useState<AssetStatus[]>(initialQuery.status);
  const [sort, setSort] = useState<NonNullable<AssetQuery["sort"]>>(
    initialQuery.sort,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const debouncedQ = useDebounce(q, 500) ?? "";
  useEffect(() => {
    if (debouncedQ === "") {
      setConditionedQ(debouncedQ);
    } else if (debouncedQ.length < 3) {
    } else if (debouncedQ.length >= 3) {
      setConditionedQ(debouncedQ);
    }
  }, [debouncedQ]);

  const { items, total, loading, error } = useAssets({
    q: conditionedQ,
    status,
    sort,
    limit: 24,
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function applyBulkStatus(next: AssetStatus) {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setNotice(null);
    try {
      // Sends every selected id in one call, which the API refuses above 50.
      const result = await bulkSetStatus(ids, next);
      setNotice(`${result.applied} updated, ${result.failed} failed.`);
      setSelectedIds(new Set());
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Bulk update failed");
    }
  }

  function handleSaved(_asset: Asset) {
    // The list is not told that anything changed, so it shows stale rows.
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>MediaVault</h1>
        <input
          className="search"
          type="search"
          placeholder="Search assets"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </header>

      <div className="filters">
        {STATUSES.map((s) => (
          <label key={s}>
            <input
              type="checkbox"
              checked={status.includes(s)}
              onChange={(e) =>
                setStatus((prev) =>
                  e.target.checked ? [...prev, s] : prev.filter((x) => x !== s),
                )
              }
            />
            {statusLabel(s)}
          </label>
        ))}
        <span className="muted">
          {loading
            ? "Loading…"
            : `${items.length} of ${total.toLocaleString()} shown`}
        </span>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulkbar">
          <span>{selectedIds.size} selected</span>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => applyBulkStatus(s)}>
              Set {statusLabel(s).toLowerCase()}
            </button>
          ))}
          <button onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      {notice && <p className="notice">{notice}</p>}
      {error && <p className="error">{error}</p>}

      <main className="content">
        <AssetGrid
          assets={items}
          selectedIds={selectedIds}
          activeId={activeId}
          onToggleSelect={toggleSelect}
          onOpen={setActiveId}
        />
        {activeId && (
          <AssetDetail
            id={activeId}
            onClose={() => setActiveId(null)}
            onSaved={handleSaved}
          />
        )}
      </main>
    </div>
  );
}
