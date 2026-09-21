"use client";

import { useCallback, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ComboboxField } from "@/components/typeahead/Combobox.Field";
import { SuggestionPanel } from "@/components/typeahead/Suggestion.Panel";
import { useAbortableSearch } from "@/hooks/use.Abortable.Search";
import { useClickOutside } from "@/hooks/use.Click.Outside";
import { liveMessage, resolveActiveIndex, stepIndex } from "@/lib/typeahead";
import {
  MIN_QUERY_LENGTH,
  SEARCH_DEBOUNCE_MS,
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

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, close);

  const { status, results, error, isDebouncing, requestId, debouncedQuery } =
    useAbortableSearch<Place>({
      query,
      minLength: MIN_QUERY_LENGTH,
      debounceMs: SEARCH_DEBOUNCE_MS,
      searchFn,
      enabled: open,
    });

  const resultsAreCurrent =
    query.trim() === debouncedQuery.trim() && !isDebouncing && status !== "loading";
  const activeIndex = resolveActiveIndex(highlight, requestId, results.length);
  const awaitingFirstSearch =
    open && query.trim().length >= MIN_QUERY_LENGTH && status === "idle";
  const busy = status === "loading" || isDebouncing || awaitingFirstSearch;
  const showList =
    open &&
    query.trim().length >= MIN_QUERY_LENGTH &&
    (busy || status === "success" || status === "empty" || status === "error");

  const optionIds = useMemo(
    () => results.map((place, index) => `${listId}-${place.id}-${index}`),
    [listId, results],
  );

  function choose(place: Place) {
    setQuery(place.name);
    setOpen(false);
    onSelect(place);
    inputRef.current?.blur();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && !showList) {
      setQuery("");
      setOpen(false);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (!showList && event.key === "ArrowDown" && results.length > 0) {
      setOpen(true);
      event.preventDefault();
      return;
    }

    if (!showList) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight({ requestId, index: stepIndex(activeIndex, results.length, 1) });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight({ requestId, index: stepIndex(activeIndex, results.length, -1) });
      return;
    }

    if (event.key !== "Enter") return;
    if (!resultsAreCurrent) {
      event.preventDefault();
      return;
    }

    const place = results[activeIndex];
    if (!place) return;

    event.preventDefault();
    choose(place);
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink/80">
        Search a neighbourhood, city, or street
      </label>

      <ComboboxField
        ref={inputRef}
        id={inputId}
        listId={listId}
        liveId={liveId}
        query={query}
        showList={showList}
        busy={busy}
        activeOptionId={showList && activeIndex >= 0 ? optionIds[activeIndex] : undefined}
        onQueryChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onClear={() => {
          setQuery("");
          setOpen(false);
          inputRef.current?.focus();
        }}
      />

      <div id={liveId} className="sr-only" aria-live="polite">
        {liveMessage({ showList, busy, status, error, count: results.length })}
      </div>

      {showList && (
        <SuggestionPanel
          listId={listId}
          busy={busy}
          resultsAreCurrent={resultsAreCurrent}
          status={status}
          error={error}
          query={query}
          results={results}
          optionIds={optionIds}
          activeIndex={activeIndex}
          selectedId={selected?.id}
          onHighlight={(index) => setHighlight({ requestId, index })}
          onChoose={choose}
        />
      )}
    </div>
  );
}
