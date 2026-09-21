import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { LocationTypeahead } from "@/components/typeahead/Location.Typeahead";
import type { Place } from "@/lib/places";

const lekki: Place = {
  id: "N:1",
  name: "Lekki",
  secondary: "Lagos, Nigeria",
  kind: "district",
  country: "Nigeria",
  state: "Lagos",
  lat: 6.45,
  lon: 3.48,
};

const ikeja: Place = {
  id: "N:2",
  name: "Ikeja",
  secondary: "Lagos, Nigeria",
  kind: "city",
  country: "Nigeria",
  state: "Lagos",
  lat: 6.6,
  lon: 3.35,
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("LocationTypeahead", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading state while a request is in flight", async () => {
    const user = userEvent.setup();
    const pending = deferred<Response>();
    vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);

    render(<LocationTypeahead onSelect={vi.fn()} selected={null} />);
    await user.type(
      screen.getByRole("combobox", { name: /search a neighbourhood/i }),
      "le",
    );

    expect(await screen.findByText("Checking verified places…")).toBeInTheDocument();
    pending.resolve(jsonResponse({ query: "le", results: [lekki] }));
  });

  it("shows results and selects the highlighted option with the keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ query: "lek", results: [lekki, ikeja] }),
    );

    render(<LocationTypeahead onSelect={onSelect} selected={null} />);

    await user.type(
      screen.getByRole("combobox", {
        name: /search a neighbourhood, city, or street/i,
      }),
      "lek",
    );

    expect(await screen.findByRole("option", { name: /lekki/i })).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(ikeja);
  });

  it("renders an empty state when the API returns nothing", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ query: "zzzz", results: [] }),
    );

    render(<LocationTypeahead onSelect={vi.fn()} selected={null} />);
    await user.type(
      screen.getByRole("combobox", { name: /search a neighbourhood/i }),
      "zzzz",
    );

    expect(await screen.findByText(/no places found for “zzzz”/i)).toBeInTheDocument();
  });

  it("renders an error state when the API fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "down" }, false, 502),
    );

    render(<LocationTypeahead onSelect={vi.fn()} selected={null} />);
    await user.type(
      screen.getByRole("combobox", { name: /search a neighbourhood/i }),
      "lekki",
    );

    expect(
      await screen.findByText(/search failed \(502\)/i, { selector: ".text-rose" }),
    ).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ query: "lek", results: [lekki] }),
    );

    render(<LocationTypeahead onSelect={vi.fn()} selected={null} />);
    const input = screen.getByRole("combobox", { name: /search a neighbourhood/i });
    await user.type(input, "lek");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("does not keep previous options selectable after the query changes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("q=lek")) {
        return jsonResponse({ query: "lek", results: [lekki, ikeja] });
      }
      return new Promise<Response>(() => undefined);
    });

    render(<LocationTypeahead onSelect={onSelect} selected={null} />);
    const input = screen.getByRole("combobox", { name: /search a neighbourhood/i });
    await user.type(input, "lek");
    expect(await screen.findByRole("option", { name: /lekki/i })).toBeInTheDocument();

    await user.type(input, "x");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(screen.getByText("Checking verified places…")).toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
