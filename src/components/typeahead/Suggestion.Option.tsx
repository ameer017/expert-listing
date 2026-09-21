import { cn } from "@/lib/cn";
import { formatKind, type Place } from "@/lib/places";
import { HighlightedText } from "@/components/ui/Highlighted.Text";
import { PinIcon } from "@/components/ui/Icons";

type SuggestionOptionProps = {
  place: Place;
  optionId: string;
  query: string;
  active: boolean;
  selected: boolean;
  onHighlight: () => void;
  onChoose: () => void;
};

export function SuggestionOption({
  place,
  optionId,
  query,
  active,
  selected,
  onHighlight,
  onChoose,
}: SuggestionOptionProps) {
  return (
    <li role="presentation">
      <button
        type="button"
        id={optionId}
        role="option"
        aria-selected={active}
        onMouseEnter={onHighlight}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onChoose}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition",
          active && "bg-leaf/10",
          !active && "hover:bg-sand/70",
          selected && "bg-leaf/10",
        )}
      >
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-sand text-leaf">
          <PinIcon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium text-ink">
            <HighlightedText text={place.name} query={query} id={optionId} />
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted">{place.secondary}</span>
        </span>
        <span className="mt-0.5 shrink-0 rounded-full bg-sand px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          {formatKind(place.kind)}
        </span>
      </button>
    </li>
  );
}
