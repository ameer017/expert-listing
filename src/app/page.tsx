import { SearchExperience } from "@/components/SearchExperience";

export default function Home() {
  return (
    <div className="relative isolate min-h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(70%_50%_at_50%_0%,rgba(31,107,74,0.16),transparent)]" />

      <header className="relative mx-auto w-full flex max-w-5xl items-center justify-center px-5 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-ink text-paper">
            <Mark />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-ink">
              Expert Listing
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">
          Property search · typeahead
        </p>
        <h1 className="font-display mt-3 max-w-3xl text-4xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Tell in three keystrokes whether the location is real.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          A production-shaped autocomplete over Photon (OpenStreetMap).
          Debounced input, loading / empty / error states, keyboard navigation,
          and stale-response safety — the same problems a listings search has to
          get right.
        </p>

        <section className="mt-10 rounded-[28px] border border-line bg-paper/80 p-4 shadow-[0_40px_80px_-48px_rgba(18,32,24,0.45)] backdrop-blur sm:p-8">
          <SearchExperience />
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          <Note
            title="Debounce + abort"
            body="Queries wait 280ms, then fire with AbortController. A newer keystroke cancels the in-flight request."
          />
          <Note
            title="Generation guard"
            body="Each request gets a monotonic id. Out-of-order responses that still resolve are dropped."
          />
          <Note
            title="ARIA combobox"
            body="Listbox, activedescendant, arrow keys, Enter, Escape, and a polite live region for result counts."
          />
        </section>
      </main>
    </div>
  );
}

function Note({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-line bg-white/70 p-5">
      <h2 className="font-medium text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </article>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
      <path
        d="M12 3.5 19 8v8l-7 4.5L5 16V8l7-4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M12 8v8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
