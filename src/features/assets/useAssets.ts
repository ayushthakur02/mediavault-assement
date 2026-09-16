import { useEffect, useRef, useState } from "react";
import { listAssets } from "@/api/client";
import type { Asset, AssetQuery } from "@/lib/types";
import { updateQueryParams } from "@/utils/queryParams";

interface State {
  items: Asset[];
  total: number;
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Baseline loader. Reviewers know this hook is wrong in several ways.
 * Replacing it wholesale is expected and encouraged.
 */
export function useAssets(query: AssetQuery) {
  const [state, setState] = useState<State>({
    items: [],
    total: 0,
    nextCursor: null,
    loading: true,
    error: null,
  });
  const requestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequestId = ++requestId.current;
    const fetchAssets = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const page = await listAssets(query, { signal: controller.signal });
        if (currentRequestId !== requestId.current) {
          return;
        }
        updateQueryParams(query);
        setState({
          items: page.items,
          total: page.total,
          nextCursor: page.nextCursor,
          loading: false,
          error: null,
        });
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        if (currentRequestId !== requestId.current) {
          return;
        }
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : "Something went wrong",
        }));
      }
    };
    void fetchAssets();
    return () => {
      controller.abort();
    };
  }, [JSON.stringify(query)]);

  return state;
}
