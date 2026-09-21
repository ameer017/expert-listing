import { forwardRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { CloseIcon, SearchIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";

type ComboboxFieldProps = {
  id: string;
  listId: string;
  liveId: string;
  query: string;
  showList: boolean;
  busy: boolean;
  activeOptionId?: string;
  onQueryChange: (value: string) => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
};

export const ComboboxField = forwardRef<HTMLInputElement, ComboboxFieldProps>(
  function ComboboxField(
    {
      id,
      listId,
      liveId,
      query,
      showList,
      busy,
      activeOptionId,
      onQueryChange,
      onFocus,
      onKeyDown,
      onClear,
    },
    ref,
  ) {
    return (
      <div
        className={cn(
          "group flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-[0_1px_0_rgba(18,32,24,0.04),0_18px_40px_-24px_rgba(18,32,24,0.35)] transition",
          showList && "border-leaf/40 ring-4 ring-leaf/10",
          !showList && "border-line hover:border-leaf/30",
        )}
      >
        <SearchIcon className="size-5 shrink-0 text-muted" />
        <input
          ref={ref}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Try Lekki, Ikeja GRA, Wuse 2…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={activeOptionId}
          aria-busy={busy}
          aria-describedby={liveId}
          className="min-h-11 w-full bg-transparent text-base text-ink outline-none placeholder:text-muted/70"
        />
        {query && (
          <button
            type="button"
            className="rounded-full p-1.5 text-muted transition hover:bg-sand hover:text-ink"
            aria-label="Clear search"
            onClick={onClear}
          >
            <CloseIcon className="size-4" />
          </button>
        )}
        {busy && <Spinner />}
      </div>
    );
  },
);
