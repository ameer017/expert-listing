import { describe, expect, it } from "vitest";
import { highlightMatch } from "@/lib/places";

describe("highlightMatch", () => {
  it("marks the first case-insensitive match", () => {
    expect(highlightMatch("Lekki Phase 1", "lek")).toEqual([
      { value: "Lek", match: true },
      { value: "ki Phase 1", match: false },
    ]);
  });

  it("returns the original text when there is no match", () => {
    expect(highlightMatch("Ikeja", "abuja")).toEqual([{ value: "Ikeja", match: false }]);
  });
});
