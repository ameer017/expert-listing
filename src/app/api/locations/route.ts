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
  if (Date.now() <= entry.expiresAt) return entry.results;

  cache.delete(key);
  return null;
}

function setCached(key: string, results: Place[]) {
  const oldest = cache.keys().next().value;
  if (cache.size >= CACHE_MAX && oldest) cache.delete(oldest);
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, results });
}

function labelFor(feature: PhotonFeature) {
  const p = feature.properties ?? {};
  const house = [p.housenumber, p.street].filter(Boolean).join(" ");
  return p.name || house || p.locality || p.city || p.state || p.country || "Unknown place";
}

function secondaryFor(feature: PhotonFeature) {
  const p = feature.properties ?? {};
  return [...new Set([p.district, p.city, p.state, p.country, p.postcode].filter(Boolean))].join(
    ", ",
  );
}

function toPlace(feature: PhotonFeature, index: number): Place | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;

  const lon = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

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

function uniquePlaces(places: Place[]) {
  const seen = new Set<string>();
  return places.flatMap((place) => {
    if (seen.has(place.id)) return [];
    seen.add(place.id);
    return [place];
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const slow = searchParams.get("slow") === "1" && process.env.NODE_ENV !== "production";

  if (query.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters." }, { status: 400 });
  }

  const cacheKey = `ng-unique:${query.toLowerCase()}`;
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
    const results = uniquePlaces(
      (payload.features ?? []).flatMap((feature, index) => {
        const place = toPlace(feature, index);
        if (!place) return [];
        return [place];
      }),
    );

    if (slow) {
      await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 700));
    }

    setCached(cacheKey, results);

    return NextResponse.json({ query, results });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Location search timed out." }, { status: 504 });
    }

    return NextResponse.json({ error: "Could not reach the location service." }, { status: 502 });
  }
}
