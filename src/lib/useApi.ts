"use client";

// Fetches JSON from one of the /api routes. Keeps showing the previous result
// while a new one loads (so charts do not flash), cancels stale requests, and
// caches responses by URL for the session (the results are deterministic).
import { useEffect, useState } from "react";

const cache = new Map<string, unknown>();

export type ApiState<T> = { data: T | null; error: string | null; loading: boolean };

type Settled = { url: string | null; data: unknown; error: string | null };

export function useApi<T>(path: string, query: string): ApiState<T> {
  const url = `${path}?${query}`;
  /** The last request that finished (any URL). */
  const [settled, setSettled] = useState<Settled>({ url: null, data: null, error: null });

  useEffect(() => {
    if (cache.has(url)) return;
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
        cache.set(url, body);
        setSettled({ url, data: body, error: null });
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setSettled((s) => ({ url, data: s.data, error: e.message }));
      });
    return () => ctrl.abort();
  }, [url]);

  const hit = cache.get(url);
  return {
    data: (hit ?? settled.data ?? null) as T | null,
    error: settled.url === url ? settled.error : null,
    loading: hit === undefined && settled.url !== url,
  };
}
