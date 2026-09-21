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

## Tradeoffs, scale, and testing

The main product tradeoff is **280ms debounce plus a Next.js proxy**. Calling Photon from the browser would be fewer files, but CORS, timeouts, Lagos bias, and Nigeria bounding would leak into every client. The BFF keeps that contract on the server, caps query length, and caches identical lookups for five minutes. An in-memory `Map` is enough for a screening app; it does not share across serverless instances, so a traffic spike would still stampede Photon. I abort in-flight `fetch` **and** ignore stale generations: abort alone is not enough when a response resolves after cancel. I also hide previous suggestions as soon as the query changes. Keeping them would feel faster, but it lets someone select Lagos while the box says Lekki.

To harden this for high traffic I would put a CDN or edge cache in front of `GET /api/locations` (`Cache-Control` is already public), move the lookup cache to Redis or KV so all instances share hits, rate-limit by IP, and swap Photon for a geocoder with an SLA. A small client LRU of the last few prefixes would cut origin load without showing a stale list. The slow-network flag stays off in production.

Tests today cover debounce, out-of-order resolves, abort-after-cleanup, keyboard select, and empty/error UI. At listing scale I would add Playwright against the real Photon path, a contract test on the GeoJSON mapper, and a load test that many concurrent “Lekki” typers still land under a few hundred milliseconds p95.

## Tests worth reading

- `src/hooks/use.Abortable.Search.test.ts` — slower “la” must not overwrite “lagos”
- `src/components/Location.Typeahead.test.tsx` — loading, empty, error, keyboard select, Escape
