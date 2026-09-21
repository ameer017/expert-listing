import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

describe("useDebouncedValue", () => {
  it("returns the latest value only after the delay", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 280),
      { initialProps: { value: "L" } },
    );

    expect(result.current).toBe("L");

    rerender({ value: "Le" });
    rerender({ value: "Lek" });
    act(() => {
      vi.advanceTimersByTime(279);
    });
    expect(result.current).toBe("L");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("Lek");

    vi.useRealTimers();
  });
});
