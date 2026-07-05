import { toAppError } from '@/services/errors';
import { createHttpClient } from '@/services/http';

/**
 * Overpass API (OpenStreetMap query engine) — keyless SHARED public instance.
 * Citizenship rules: identify yourself (anonymous UAs get 406 — verified),
 * keep queries bounded, and retry at most once.
 */

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
  /** Overpass reports runtime failures (e.g. timeouts) HERE with HTTP 200. */
  remark?: string;
}

const client = createHttpClient({
  baseURL: 'https://overpass-api.de/api',
  timeout: 15_000, // heavier engine than a REST lookup — give it headroom
  headers: {
    'User-Agent': 'Roava/0.1 (Expo learning project)',
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runQuery(query: string): Promise<OverpassResponse> {
  // POST because Overpass QL outgrows comfortable URL lengths. It's still
  // semantically a READ (idempotent), so ONE manual retry is safe — this is
  // the documented exception to "only GETs retry" in http.ts.
  const res = await client.post<OverpassResponse>(
    '/interpreter',
    `data=${encodeURIComponent(query)}`,
  );
  // Overpass returns HTTP 200 for runtime failures and puts the truth in
  // `remark` (verified: Paris park scan → "Query timed out" + empty elements).
  // Without this check a timeout masquerades as "this city has no sights."
  if (res.data.remark?.toLowerCase().includes('error')) {
    throw new Error(`Overpass remark: ${res.data.remark}`);
  }
  return res.data;
}

export async function fetchNearbyPois(
  lat: number,
  lon: number,
  radiusM = 4000,
): Promise<OverpassElement[]> {
  const around = `(around:${radiusM},${lat},${lon})`;
  const tourism = '["tourism"~"attraction|museum|viewpoint|gallery"]';
  // No park selector: `leisure=park` over a 4 km radius times out on dense
  // cities (Paris died at timeout:10 while Mumbai passed). Tourism-only
  // completes in ~2 s everywhere tested. Parks return with Phase 9's maps.
  const query = `[out:json][timeout:10];(node${tourism}${around};way${tourism}${around};);out center 30;`;

  try {
    return (await runQuery(query)).elements;
  } catch (error) {
    const appError = toAppError(error);
    if (!appError.retryable) throw appError;
    await sleep(600);
    return (await runQuery(query)).elements;
  }
}

export type { OverpassElement };
