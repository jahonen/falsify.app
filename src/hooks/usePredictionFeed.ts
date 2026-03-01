"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listPredictions, type FeedParams, type FeedResult } from "../services/prediction-service";

export type UsePredictionFeedParams = Omit<FeedParams, "cursor"> & { pageSize?: number };

export function usePredictionFeed(params: UsePredictionFeedParams = {}) {
  const pageSize = params.pageSize ?? 10;
  const [items, setItems] = useState<FeedResult["items"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<FeedResult["nextCursor"]>(null);
  const [hasMore, setHasMore] = useState(true);
  const mounted = useRef(true);

  const baseParams = useMemo<FeedParams>(() => ({
    pageSize,
    domain: params.domain ?? null,
    status: params.status ?? null
  }), [pageSize, params.domain, params.status]);

  const load = useCallback(async (reset: boolean) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listPredictions({ ...baseParams, cursor: reset ? null : cursor });
      if (!mounted.current) return;
      setItems((prev) => reset ? res.items : [...prev, ...res.items]);
      setCursor(res.nextCursor);
      setHasMore(!!res.nextCursor);
    } catch (e: any) {
      if (!mounted.current) return;
      setError(e?.message || "Failed to load feed");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [baseParams, cursor, loading]);

  useEffect(() => {
    mounted.current = true;
    load(true);
    return () => { mounted.current = false; };
  }, [baseParams, load]);

  const loadMore = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return { items, loading, error, hasMore, loadMore, refresh } as const;
}
