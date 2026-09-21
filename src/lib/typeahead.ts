import type { SearchStatus } from "@/lib/places";

export function resolveActiveIndex(
  highlight: { requestId: number; index: number },
  requestId: number,
  resultCount: number,
) {
  if (highlight.requestId === requestId) return highlight.index;
  if (resultCount === 0) return -1;
  return 0;
}

export function stepIndex(activeIndex: number, resultCount: number, direction: 1 | -1) {
  const count = Math.max(resultCount, 1);
  return (Math.max(activeIndex, 0) + direction + count) % count;
}

export function liveMessage({
  showList,
  busy,
  status,
  error,
  count,
}: {
  showList: boolean;
  busy: boolean;
  status: SearchStatus;
  error: string | null;
  count: number;
}) {
  if (!showList) return "";
  if (busy) return "Searching places";
  if (status === "empty") return "No places found";
  if (status === "error") return error ?? "Search failed";
  if (count === 1) return "1 place found";
  return `${count} places found`;
}
