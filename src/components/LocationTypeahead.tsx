"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useAbortableSearch } from "@/hooks/useAbortableSearch";
import { cn } from "@/lib/cn";
import {
  MIN_QUERY_LENGTH,
  SEARCH_DEBOUNCE_MS,
  formatKind,
  highlightMatch,
  searchPlaces,
  type Place,
} from "@/lib/places";

type LocationTypeaheadProps = {
  onSelect: (place: Place) => void;
  selected: Place | null;
  slowNetwork?: boolean;
  initialQuery?: string;
};

export function LocationTypeahead({
  onSelect,
  selected,
  slowNetwork = false,
  initialQuery = "",
}: LocationTypeaheadProps) {
  const listId = useId();
  const inputId = useId();
  const liveId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(initialQuery.trim().length >= MIN_QUERY_LENGTH);
  const [highlight, setHighlight] = useState({ requestId: 0, index: 0 });

  const searchFn = useCallback(
    (value: string, signal: AbortSignal) => searchPlaces(value, signal, { slow: slowNetwork }),
    [slowNetwork],
  );

  const { status, results, error, isDebouncing, requestId } = useAbortableSearch<Place>({
    query,
    minLength: MIN_QUERY_LENGTH,
    debounceMs: SEARCH_DEBOUNCE_MS,
    searchFn,
    enabled: open,
  });

  const activeIndex =
    highlight.requestId === requestId
      ? highlight.index
      : results.length > 0
        ? 0
        : -1;

  const awaitingFirstSearch =
    open && query.trim().length >= MIN_QUERY_LENGTH && status === "idle";
  const busy = status === "loading" || isDebouncing || awaitingFirstSearch;
  const showList =
    open &&
    query.trim().length >= MIN_QUERY_LENGTH &&
    (busy || status === "success" || status === "empty" || status === "error");

  const optionIds = useMemo(
    () => results.map((place) => `${listId}-${place.id}`),
    [listId, results],
  );

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function choose(place: Place) {
    setQuery(place.name);
    setOpen(false);
    onSelect(place);
    inputRef.current?.blur();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showList && event.key === "ArrowDown" && results.length > 0) {
      setOpen(true);
      event.preventDefault();
      return;
    }

    if (!showList) {
      if (event.key === "Escape") {
        setQuery("");
        setOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = (Math.max(activeIndex, 0) + 1) % Math.max(results.length, 1);
      setHighlight({ requestId, index: next });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = activeIndex <= 0 ? Math.max(results.length - 1, 0) : activeIndex - 1;
      setHighlight({ requestId, index: next });
    } else if (event.key === "Enter") {
      const place = results[activeIndex];
      if (place) {
        event.preventDefault();
        choose(place);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  const liveMessage = !showList
    ? ""
    : busy
      ? "Searching places"
      : status === "empty"
        ? "No places found"
        : status === "error"
          ? error ?? "Search failed"
          : `${results.length} ${results.length === 1 ? "place" : "places"} found`;

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink/80">
        Search a neighbourhood, city, or street
      </label>

      <div
        className={cn(
          "group flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-[0_1px_0_rgba(18,32,24,0.04),0_18px_40px_-24px_rgba(18,32,24,0.35)] transition",
          showList ? "border-leaf/40 ring-4 ring-leaf/10" : "border-line hover:border-leaf/30",
        )}
      >
        <SearchIcon className="size-5 shrink-0 text-muted" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Try Lekki, Ikeja GRA, Wuse 2…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={
            showList && activeIndex >= 0 ? optionIds[activeIndex] : undefined
          }
          aria-busy={busy}
          aria-describedby={liveId}
          className="min-h-11 w-full bg-transparent text-base text-ink outline-none placeholder:text-muted/70"
        />
        {query ? (
          <button
            type="button"
            className="rounded-full p-1.5 text-muted transition hover:bg-sand hover:text-ink"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
          >
            <CloseIcon className="size-4" />
          </button>
        ) : null}
        {busy ? <Spinner /> : null}
      </div>

      <div id={liveId} className="sr-only" aria-live="polite">
        {liveMessage}
      </div>

      {showList ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Place suggestions"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-28px_rgba(18,32,24,0.45)]"
        >
          {busy && results.length === 0 ? (
            <StatusRow>Checking verified places…</StatusRow>
          ) : status === "error" ? (
            <StatusRow tone="error">{error}</StatusRow>
          ) : status === "empty" ? (
            <StatusRow>
              No places found for “{query.trim()}”. Try a city, estate, or street.
            </StatusRow>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((place, index) => {
                const active = index === activeIndex;
                return (
                  <li key={place.id} role="presentation">
                    <button
                      type="button"
                      id={optionIds[index]}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setHighlight({ requestId, index })}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(place)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition",
                        active ? "bg-leaf/10" : "hover:bg-sand/70",
                        selected?.id === place.id && "bg-leaf/10",
                      )}
                    >
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-sand text-leaf">
                        <PinIcon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-ink">
                          {highlightMatch(place.name, query).map((part, partIndex) => (
                            <span
                              key={`${place.id}-${partIndex}`}
                              className={part.match ? "text-leaf" : undefined}
                            >
                              {part.value}
                            </span>
                          ))}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-muted">
                          {place.secondary}
                        </span>
                      </span>
                      <span className="mt-0.5 shrink-0 rounded-full bg-sand px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                        {formatKind(place.kind)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StatusRow({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <div
      className={cn(
        "px-4 py-4 text-sm",
        tone === "error" ? "text-rose" : "text-muted",
      )}
    >
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="size-4 shrink-0 animate-spin rounded-full border-2 border-leaf/20 border-t-leaf"
      aria-hidden
    />
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 21s6.5-5.2 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="10.5" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
