import type { Place } from "@/lib/places";

function mapEmbedUrl(place: Place) {
  const lat = place.lat;
  const lon = place.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

  const bbox = [lon - 0.03, lat - 0.02, lon + 0.03, lat + 0.02]
    .map((value) => value.toFixed(6))
    .join(",");

  const params = new URLSearchParams({
    bbox,
    layer: "mapnik",
    marker: `${lat.toFixed(6)},${lon.toFixed(6)}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

export function PlaceMap({ place }: { place: Place }) {
  const mapSrc = mapEmbedUrl(place);
  if (!mapSrc) {
    return (
      <div className="grid h-full min-h-64 place-items-center px-6 text-sm text-muted">
        Map unavailable for this coordinate.
      </div>
    );
  }

  return (
    <iframe
      title={`Map of ${place.name}`}
      src={mapSrc}
      referrerPolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-popups"
      className="h-full min-h-64 w-full grayscale-[0.15] contrast-[1.05]"
    />
  );
}
