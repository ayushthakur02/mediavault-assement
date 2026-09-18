import { useCallback, useEffect, useRef, useState } from "react";
import { listAssets } from "@/api/client";
import type { Asset, AssetQuery } from "@/lib/types";
import { updateQueryParams } from "@/utils/queryParams";

interface State {
  items: Asset[];
  total: number;
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

const initialState: State = {
  items: [],
  total: 0,
  nextCursor: null,
  loading: true,
  loadingMore: false,
  error: null,
};

export function useAssets(query: AssetQuery) {
  const [state, setState] = useState<State>(initialState);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const requestId = useRef(0);
  const queryRef = useRef(query);
  const nextCursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequestId = ++requestId.current;

    nextCursorRef.current = null;
    loadingMoreRef.current = false;

    const fetchInitialAssets = async () => {
      setState((previous) => ({
        ...previous,
        items: [],
        nextCursor: null,
        loading: true,
        loadingMore: false,
        error: null,
      }));

      try {
        const page = await listAssets(
          {
            ...query,
            cursor: undefined,
          },
          { signal: controller.signal },
        );

        if (currentRequestId !== requestId.current) return;

        nextCursorRef.current = page.nextCursor;

        updateQueryParams(query);

        setState({
          items: page.items,
          total: page.total,
          nextCursor: page.nextCursor,
          loading: false,
          loadingMore: false,
          error: null,
        });
      } catch (error: unknown) {
        if (
          controller.signal.aborted ||
          currentRequestId !== requestId.current
        ) {
          return;
        }

        setState((previous) => ({
          ...previous,
          loading: false,
          loadingMore: false,
          error:
            error instanceof Error ? error.message : "Something went wrong",
        }));
      }
    };

    void fetchInitialAssets();

    return () => {
      controller.abort();
      loadMoreControllerRef.current?.abort();
    };
  }, [JSON.stringify(query), retryCount]);

  const loadMore = useCallback(async () => {
    const cursor = nextCursorRef.current;

    if (!cursor || loadingMoreRef.current) return;

    loadingMoreRef.current = true;

    const currentRequestId = requestId.current;
    const controller = new AbortController();

    loadMoreControllerRef.current = controller;

    setState((previous) => ({
      ...previous,
      loadingMore: true,
      error: null,
    }));

    try {
      const page = await listAssets(
        {
          ...queryRef.current,
          cursor,
        },
        { signal: controller.signal },
      );

      if (currentRequestId !== requestId.current) return;

      nextCursorRef.current = page.nextCursor;

      setState((previous) => ({
        ...previous,
        items: [...previous.items, ...page.items],
        total: page.total,
        nextCursor: page.nextCursor,
        loadingMore: false,
        error: null,
      }));
    } catch (error: unknown) {
      if (controller.signal.aborted || currentRequestId !== requestId.current)
        return;

      setState((previous) => ({
        ...previous,
        loadingMore: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      }));
    } finally {
      if (loadMoreControllerRef.current === controller) {
        loadMoreControllerRef.current = null;
      }
      if (currentRequestId === requestId.current) {
        loadingMoreRef.current = false;
      }
    }
  }, []);

  const retry = useCallback(() => {
    if (loadingMoreRef.current) return;
    const cursor = nextCursorRef.current;
    if (cursor) {
      void loadMore();
    } else {
      setRetryCount((prev) => prev + 1);
    }
  }, [loadMore]);

  return {
    ...state,
    loadMore,
    retry,
  };
}
