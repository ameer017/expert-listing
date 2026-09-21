# Expert Listing — location typeahead

Screening task for the Frontend Engineer role at [Expert Listing](mailto:recruitment@expertlisting.ng): a small, production-shaped **typeahead** over a public geocoding API.

The UI is a neighbourhood search — the same interaction a Lagos listings platform needs before maps, price history, or flood-risk overlays ever load.

## Requirements coverage

| Requirement | Implementation |
| --- | --- |
| Debounced input | `useDebouncedValue` waits **280ms** after the last keystroke; searches start at **2 characters**. |
| Loading / empty / error | Spinner + “Checking verified places…”, empty copy for zero hits, error copy on non-OK responses. A polite live region announces the state. |
| Keyboard navigation | WAI-ARIA combobox: `ArrowUp` / `ArrowDown` move highlight, `Enter` selects, `Escape` closes. |
| Out-of-order / stale responses | **AbortController** cancels the in-flight request; a **monotonic request id** ignores any response that is no longer current. |

Turn on **Simulate slow / racing responses** in the UI to add 0.9–1.6s of jitter and type quickly — the list should still match the latest query.

## Why this API

Queries go through `GET /api/locations`, which proxies [Photon](https://photon.komoot.io/) (OpenStreetMap geocoding).

- Location search is the actual product surface, not a toy countries list.
- Results are **bounded to Nigeria** and biased toward **Lagos**, matching Expert Listing’s market.
- The browser never talks to Photon directly: CORS, timeouts, and a short in-memory cache stay on the server.

## Architecture

```
src/
  components/typeahead/Location.Typeahead.tsx
  components/typeahead/Combobox.Field.tsx
  components/typeahead/Suggestion.Panel.tsx
  hooks/use.Abortable.Search.ts
  hooks/use.Debounced.Value.ts
  app/api/locations/route.ts
  lib/places.ts
```

`useAbortableSearch` is generic on purpose. The listings app could reuse it for agents, estates, or postcodes without copying race-handling logic.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test      # vitest: debounce, stale responses, keyboard, empty/error
npm run lint
npm run build
```

## Tradeoffs

- **280ms debounce** is a balance between Photon rate limits and feeling instant. Faster would hammer the API; slower would feel sticky on mobile.
- **Abort + request ids** together: `fetch` abort covers the common case; the id covers responses that resolve after abort (or mocks that ignore `AbortSignal`).
- **No client cache** of search results. The route caches identical queries for five minutes; the client always reflects the current keystrokes.
- **Photon, not Google Places.** No API key, good enough for a screening task, and the contract is easy to swap for a paid geocoder later.

## Tests worth reading

- `src/hooks/use.Abortable.Search.test.ts` — slower “la” must not overwrite “lagos”
- `src/components/Location.Typeahead.test.tsx` — loading, empty, error, keyboard select, Escape
