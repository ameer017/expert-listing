import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAbortableSearch } from "@/hooks/use.Abortable.Search";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useAbortableSearch", () => {
  it("does not search until the query meets minLength", async () => {
    const searchFn = vi.fn().mockResolvedValue([]);

    renderHook(() =>
      useAbortableSearch({
        query: "L",
        minLength: 2,
        debounceMs: 0,
        searchFn,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(searchFn).not.toHaveBeenCalled();
  });

  it("keeps the later query when an earlier request resolves last", async () => {
    const first = deferred<string[]>();
    const second = deferred<string[]>();
    const searchFn = vi.fn((query: string) => {
      if (query === "la") return first.promise;
      if (query === "lagos") return second.promise;
      return Promise.resolve([]);
    });

    const { result, rerender } = renderHook(
      ({ query }) =>
        useAbortableSearch({
          query,
          minLength: 2,
          debounceMs: 0,
          searchFn,
        }),
      { initialProps: { query: "la" } },
    );

    await waitFor(() => expect(searchFn).toHaveBeenCalledTimes(1));

    rerender({ query: "lagos" });
    await waitFor(() => expect(searchFn).toHaveBeenCalledTimes(2));

    await act(async () => {
      second.resolve(["Lagos"]);
      await second.promise;
    });

    expect(result.current.results).toEqual(["Lagos"]);
    expect(result.current.status).toBe("success");

    await act(async () => {
      first.resolve(["Los Angeles"]);
      await first.promise.catch(() => undefined);
    });

    expect(result.current.results).toEqual(["Lagos"]);
    expect(result.current.status).toBe("success");
  });

  it("drops a resolve that arrives after abort invalidates the request id", async () => {
    const first = deferred<string[]>();
    const searchFn = vi.fn((query: string) => {
      if (query === "la") return first.promise;
      return Promise.resolve([]);
    });

    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useAbortableSearch({
          query: "la",
          minLength: 2,
          debounceMs: 0,
          searchFn,
          enabled,
        }),
      { initialProps: { enabled: true } },
    );

    await waitFor(() => expect(searchFn).toHaveBeenCalledTimes(1));
    rerender({ enabled: false });

    await act(async () => {
      first.resolve(["Louisiana"]);
      await first.promise;
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.results).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("surfaces an error state without using a stale failure", async () => {
    const first = deferred<string[]>();
    const second = deferred<string[]>();
    const searchFn = vi.fn((query: string) => {
      if (query === "xx") return first.promise;
      return second.promise;
    });

    const { result, rerender } = renderHook(
      ({ query }) =>
        useAbortableSearch({
          query,
          minLength: 2,
          debounceMs: 0,
          searchFn,
        }),
      { initialProps: { query: "xx" } },
    );

    await waitFor(() => expect(searchFn).toHaveBeenCalledTimes(1));
    rerender({ query: "ikeja" });
    await waitFor(() => expect(searchFn).toHaveBeenCalledTimes(2));

    await act(async () => {
      second.resolve(["Ikeja"]);
    });

    await act(async () => {
      first.reject(new Error("network down"));
    });

    expect(result.current.status).toBe("success");
    expect(result.current.results).toEqual(["Ikeja"]);
    expect(result.current.error).toBeNull();
  });
});
