"use client";

import { useEffect, useRef, useState } from "react";
import type { SearchStatus } from "@/lib/places";
import { useDebouncedValue } from "@/hooks/use.Debounced.Value";

type SearchFn<T> = (query: string, signal: AbortSignal) => Promise<T[]>;

type Options<T> = {
  query: string;
  minLength: number;
  debounceMs: number;
  searchFn: SearchFn<T>;
  enabled?: boolean;
};

type State<T> = {
  status: SearchStatus;
  results: T[];
  error: string | null;
  requestId: number;
};

export function useAbortableSearch<T>({
  query,
  minLength,
  debounceMs,
  searchFn,
  enabled = true,
}: Options<T>) {
  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const latestRequestId = useRef(0);
  const [state, setState] = useState<State<T>>({
    status: "idle",
    results: [],
    error: null,
    requestId: 0,
  });

  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (!enabled || trimmed.length < minLength) {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;
      setState({
        status: "idle",
        results: [],
        error: null,
        requestId,
      });
      return;
    }

    const controller = new AbortController();
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    setState({
      status: "loading",
      results: [],
      error: null,
      requestId,
    });

    searchFn(trimmed, controller.signal)
      .then((results) => {
        if (controller.signal.aborted) return;
        if (requestId !== latestRequestId.current) return;

        const status: SearchStatus = results.length === 0 ? "empty" : "success";
        setState({ status, results, error: null, requestId });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (requestId !== latestRequestId.current) return;

        const message = toSearchError(error);
        if (!message) return;

        setState({ status: "error", results: [], error: message, requestId });
      });

    return () => {
      controller.abort();
      if (latestRequestId.current === requestId) {
        latestRequestId.current += 1;
      }
    };
  }, [debouncedQuery, minLength, searchFn, enabled]);

  return {
    ...state,
    debouncedQuery,
    isDebouncing:
      enabled &&
      query.trim() !== debouncedQuery.trim() &&
      query.trim().length >= minLength,
  };
}

function toSearchError(error: unknown) {
  if (!(error instanceof Error)) return "Could not search places. Try again.";
  if (error.name === "AbortError") return null;
  return error.message;
}
