import { formatKind, type Place } from "@/lib/places";
import { PlaceMap } from "@/components/place/Place.Map";

export function SelectedPlace({ place }: { place: Place }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_24px_60px_-36px_rgba(18,32,24,0.4)]">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">
            Selected place
          </p>
          <h2 className="font-display mt-2 text-3xl tracking-tight text-ink">{place.name}</h2>
          <p className="mt-2 text-muted">{place.secondary || "Location details unavailable"}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <Fact label="Type" value={formatKind(place.kind)} />
            <Fact label="Postcode" value={place.postcode ?? "—"} />
            <Fact label="Latitude" value={place.lat.toFixed(5)} />
            <Fact label="Longitude" value={place.lon.toFixed(5)} />
          </dl>

          <p className="mt-6 rounded-2xl bg-sand px-4 py-3 text-sm leading-6 text-ink/80">
            In the listings product this pin would load two years of price history, a live map,
            and a flood-risk overlay — the same geographic backbone this typeahead is built on.
          </p>
        </div>

        <div className="min-h-64 border-t border-line lg:border-l lg:border-t-0">
          <PlaceMap place={place} />
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  );
}
