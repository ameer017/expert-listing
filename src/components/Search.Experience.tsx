"use client";

import { useState } from "react";
import { LocationTypeahead } from "@/components/typeahead/Location.Typeahead";
import { SelectedPlace } from "@/components/Selected.Place";
import type { Place } from "@/lib/places";

const SUGGESTIONS = ["Lekki Phase 1", "Ikeja", "Victoria Island", "Wuse 2", "Port Harcourt"];

export function SearchExperience() {
  const [selected, setSelected] = useState<Place | null>(null);
  const [slowNetwork, setSlowNetwork] = useState(false);
  const [preset, setPreset] = useState({ query: "", nonce: 0 });

  return (
    <div className="space-y-8">
      <LocationTypeahead
        key={`${preset.nonce}-${preset.query}`}
        initialQuery={preset.query}
        selected={selected}
        onSelect={setSelected}
        slowNetwork={slowNetwork}
      />

      <HintChips
        onPick={(hint) => {
          setSelected(null);
          setPreset((current) => ({ query: hint, nonce: current.nonce + 1 }));
        }}
      />

      <SlowNetworkToggle checked={slowNetwork} onChange={setSlowNetwork} />

      {selected && <SelectedPlace place={selected} />}
      {!selected && <EmptySelection />}
    </div>
  );
}

function HintChips({ onPick }: { onPick: (hint: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {SUGGESTIONS.map((hint) => (
        <button
          key={hint}
          type="button"
          onClick={() => onPick(hint)}
          className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-muted transition hover:border-leaf/40 hover:text-ink"
        >
          {hint}
        </button>
      ))}
    </div>
  );
}

function SlowNetworkToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-dashed border-line bg-white/70 px-4 py-3 text-sm text-muted">
      <input
        type="checkbox"
        className="mt-0.5 size-4 accent-leaf"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="block font-medium text-ink">Simulate slow / racing responses</span>
        Adds 0.9&minus;1.6s of latency so typing quickly can return out of order. The UI still shows
        only the latest query.
      </span>
    </label>
  );
}

function EmptySelection() {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <p className="font-display text-xl text-ink">Pick a place to preview the pin</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        Use the arrow keys, Enter to select, and Escape to close. Stale responses from earlier
        keystrokes are aborted and ignored.
      </p>
    </div>
  );
}
