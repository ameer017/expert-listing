export type Place = {
  id: string;
  name: string;
  secondary: string;
  kind: string;
  country: string;
  state?: string;
  city?: string;
  postcode?: string;
  lat: number;
  lon: number;
};

export type PlaceSearchResponse = {
  query: string;
  results: Place[];
};

export type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

export const MIN_QUERY_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 280;

const KIND_LABELS: Record<string, string> = {
  house: "Address",
  street: "Street",
  district: "District",
  locality: "Locality",
  city: "City",
  county: "LGA",
  state: "State",
  country: "Country",
  hamlet: "Hamlet",
  other: "Place",
};

export function formatKind(kind: string) {
  return KIND_LABELS[kind] ?? kind.replace(/_/g, " ");
}

export function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return [{ value: text, match: false }];

  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const index = lower.indexOf(needle);

  if (index === -1) return [{ value: text, match: false }];

  return [
    { value: text.slice(0, index), match: false },
    { value: text.slice(index, index + q.length), match: true },
    { value: text.slice(index + q.length), match: false },
  ].filter((part) => part.value.length > 0);
}

export async function searchPlaces(
  query: string,
  signal: AbortSignal,
  options: { slow?: boolean } = {},
): Promise<Place[]> {
  const params = new URLSearchParams({ q: query });
  if (options.slow) params.set("slow", "1");

  const response = await fetch(`/api/locations?${params.toString()}`, {
    signal,
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Search failed (${response.status})`);
  }

  const payload = (await response.json()) as PlaceSearchResponse;
  return payload.results;
}
