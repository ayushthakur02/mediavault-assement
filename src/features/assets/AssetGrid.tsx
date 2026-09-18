import { thumbnailUrl } from "@/api/client";
import { formatBytes, formatDate, statusLabel } from "@/lib/format";
import type { Asset } from "@/lib/types";
import { useState } from "react";
import { AssetThumbnail } from "./AssetThumbnail";

interface Props {
  loadMoreRef: React.RefObject<HTMLDivElement>;
  error: string | null;
  assets: Asset[];
  selectedIds: Set<string>;
  activeId: string | null;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

/**
 * Baseline grid. Renders every row it is given, re-renders every card on any
 * selection change, and is not reachable by keyboard.
 */
export function AssetGrid({
  loadMoreRef,
  error,
  assets,
  selectedIds,
  activeId,
  onToggleSelect,
  onOpen,
}: Props) {
  if (assets.length === 0) {
    return (
      <div className="empty">
        <p>Nothing matches these filters.</p>
        <p className="muted">
          Clear the search box or widen the status filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className={
            "card" +
            (selectedIds.has(asset.id) ? " card--selected" : "") +
            (activeId === asset.id ? " card--active" : "")
          }
          onClick={() => onOpen(asset.id)}
        >
          <AssetThumbnail asset={asset} />
          <div className="card__body">
            <p className="card__name">{asset.name}</p>
            <p className="muted">
              {asset.kind} · {formatBytes(asset.sizeBytes)} ·{" "}
              {formatDate(asset.updatedAt)}
            </p>
            <span className={`pill pill--${asset.status}`}>
              {statusLabel(asset.status)}
            </span>
          </div>
          <input
            type="checkbox"
            className="card__check"
            checked={selectedIds.has(asset.id)}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onToggleSelect(asset.id)}
          />
        </div>
      ))}
      {!error && <div ref={loadMoreRef} id="load-more-sentinel" aria-hidden="true" />}
    </div>
  );
}