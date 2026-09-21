import { NextResponse } from "next/server";
import type { Place } from "@/lib/places";

const PHOTON_URL = "https://photon.komoot.io/api/";
const LAGOS = { lat: 6.5244, lon: 3.3792 };
const NIGERIA_BBOX = "2.67,4.27,14.68,13.89";
const MAX_QUERY_LENGTH = 80;
const RESULT_LIMIT = 8;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 50;

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    country?: string;
    state?: string;
    city?: string;
    district?: string;
    locality?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    type?: string;
  };
};

type CacheEntry = { expiresAt: number; results: Place[] };

const cache = new Map<string, CacheEntry>();

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.results;
}

function setCached(key: string, results: Place[]) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, results });
}

function labelFor(feature: PhotonFeature) {
  const p = feature.properties ?? {};
  const house = [p.housenumber, p.street].filter(Boolean).join(" ");
  return p.name || house || p.locality || p.city || p.state || p.country || "Unknown place";
}

function secondaryFor(feature: PhotonFeature) {
  const p = feature.properties ?? {};
  const parts = [p.district, p.city, p.state, p.country, p.postcode].filter(
    (part, index, all) => Boolean(part) && all.indexOf(part) === index,
  );
  return parts.join(", ");
}

function toPlace(feature: PhotonFeature, index: number): Place | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;

  const [lon, lat] = coords;
  const p = feature.properties ?? {};
  const id = p.osm_type && p.osm_id ? `${p.osm_type}:${p.osm_id}` : `feature:${index}`;

  return {
    id,
    name: labelFor(feature),
    secondary: secondaryFor(feature),
    kind: p.type ?? "place",
    country: p.country ?? "",
    state: p.state,
    city: p.city,
    postcode: p.postcode,
    lat,
    lon,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const slow = searchParams.get("slow") === "1";

  if (query.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters." }, { status: 400 });
  }

  const cacheKey = `ng:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached && !slow) {
    return NextResponse.json(
      { query, results: cached },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  }

  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(RESULT_LIMIT));
  url.searchParams.set("lang", "en");
  url.searchParams.set("lat", String(LAGOS.lat));
  url.searchParams.set("lon", String(LAGOS.lon));
  url.searchParams.set("bbox", NIGERIA_BBOX);
  url.searchParams.set("location_bias_scale", "0.6");

  try {
    const upstream = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 300 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Location search is temporarily unavailable." },
        { status: 502 },
      );
    }

    const payload = (await upstream.json()) as { features?: PhotonFeature[] };
    const results = (payload.features ?? [])
      .map(toPlace)
      .filter((place): place is Place => place !== null);

    if (slow) {
      // Lets reviewers type quickly and watch stale responses get dropped.
      await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 700));
    }

    setCached(cacheKey, results);

    return NextResponse.json({ query, results });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      { error: timedOut ? "Location search timed out." : "Could not reach the location service." },
      { status: timedOut ? 504 : 502 },
    );
  }
}
