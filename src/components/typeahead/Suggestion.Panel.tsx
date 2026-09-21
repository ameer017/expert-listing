import type { Place, SearchStatus } from "@/lib/places";
import { StatusRow } from "@/components/ui/Status.Row";
import { SuggestionOption } from "@/components/typeahead/Suggestion.Option";

type SuggestionPanelProps = {
  listId: string;
  busy: boolean;
  resultsAreCurrent: boolean;
  status: SearchStatus;
  error: string | null;
  query: string;
  results: Place[];
  optionIds: string[];
  activeIndex: number;
  selectedId?: string;
  onHighlight: (index: number) => void;
  onChoose: (place: Place) => void;
};

export function SuggestionPanel({
  listId,
  busy,
  resultsAreCurrent,
  status,
  error,
  query,
  results,
  optionIds,
  activeIndex,
  selectedId,
  onHighlight,
  onChoose,
}: SuggestionPanelProps) {
  return (
    <div
      id={listId}
      role="listbox"
      aria-label="Place suggestions"
      className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-28px_rgba(18,32,24,0.45)]"
    >
      <SuggestionBody
        busy={busy}
        resultsAreCurrent={resultsAreCurrent}
        status={status}
        error={error}
        query={query}
        results={results}
        optionIds={optionIds}
        activeIndex={activeIndex}
        selectedId={selectedId}
        onHighlight={onHighlight}
        onChoose={onChoose}
      />
    </div>
  );
}

function SuggestionBody({
  busy,
  resultsAreCurrent,
  status,
  error,
  query,
  results,
  optionIds,
  activeIndex,
  selectedId,
  onHighlight,
  onChoose,
}: Omit<SuggestionPanelProps, "listId">) {
  if (busy || !resultsAreCurrent) {
    return <StatusRow>Checking verified places…</StatusRow>;
  }

  if (status === "error") {
    return <StatusRow tone="error">{error}</StatusRow>;
  }

  if (status === "empty") {
    return (
      <StatusRow>
        No places found for “{query.trim()}”. Try a city, estate, or street.
      </StatusRow>
    );
  }

  return (
    <ul className="max-h-80 overflow-y-auto py-1">
      {results.map((place, index) => (
        <SuggestionOption
          key={optionIds[index]}
          place={place}
          optionId={optionIds[index]}
          query={query}
          active={index === activeIndex}
          selected={selectedId === place.id}
          onHighlight={() => onHighlight(index)}
          onChoose={() => {
            if (!resultsAreCurrent) return;
            onChoose(place);
          }}
        />
      ))}
    </ul>
  );
}
