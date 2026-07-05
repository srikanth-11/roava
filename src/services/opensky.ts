import { createHttpClient, getWithRetry } from '@/services/http';

/**
 * OpenSky Network — anonymous tier (keyless): ~400 credits/day, 10 s data
 * resolution. Cost scales with query AREA, not response size (measured: a
 * global call is 4 credits even when icao24-filtered and 166 bytes) — so
 * tracking polls pass a bbox around the last-known position to pay 1.
 * Remaining budget is surfaced in the X-Rate-Limit-Remaining header.
 */

/**
 * /states/all returns positional arrays, not objects — index constants keep
 * the mapping readable. (Fields per the OpenSky REST docs.)
 */
const IDX = {
  icao24: 0,
  callsign: 1,
  originCountry: 2,
  longitude: 5,
  latitude: 6,
  baroAltitude: 7,
  onGround: 8,
  velocity: 9,
  trueTrack: 10,
  verticalRate: 11,
  lastContact: 4,
} as const;

type RawState = (string | number | boolean | null)[];

interface StatesResponse {
  time: number;
  states: RawState[] | null;
}

export interface OpenSkyState {
  icao24: string;
  /** Trimmed — the API pads callsigns with trailing spaces (verified). */
  callsign: string;
  originCountry: string;
  lon: number | null;
  lat: number | null;
  altitudeM: number | null;
  onGround: boolean;
  velocityMs: number | null;
  headingDeg: number | null;
  verticalRateMs: number | null;
  /** Epoch seconds of the last received message. */
  lastContact: number;
}

const client = createHttpClient({
  baseURL: 'https://opensky-network.org/api',
  timeout: 25_000, // a ~1.6 MB global snapshot needs headroom on mobile links
});

function toState(raw: RawState): OpenSkyState {
  return {
    icao24: String(raw[IDX.icao24] ?? ''),
    callsign: String(raw[IDX.callsign] ?? '').trim(),
    originCountry: String(raw[IDX.originCountry] ?? ''),
    lon: raw[IDX.longitude] as number | null,
    lat: raw[IDX.latitude] as number | null,
    altitudeM: raw[IDX.baroAltitude] as number | null,
    onGround: Boolean(raw[IDX.onGround]),
    velocityMs: raw[IDX.velocity] as number | null,
    headingDeg: raw[IDX.trueTrack] as number | null,
    verticalRateMs: raw[IDX.verticalRate] as number | null,
    lastContact: Number(raw[IDX.lastContact] ?? 0),
  };
}

/** Global snapshot — 4 credits. Callers MUST cache (see FlightsRepository). */
export async function fetchAllStates(): Promise<{ time: number; states: OpenSkyState[] }> {
  const res = await getWithRetry<StatesResponse>(client, '/states/all');
  return { time: res.time, states: (res.states ?? []).map(toState) };
}

/**
 * Single aircraft — 1 credit when a bbox is provided (±1.5° around the last
 * position ≈ 300 km of travel headroom), 4 credits without one.
 */
export async function fetchStateByIcao24(
  icao24: string,
  near?: { lat: number; lon: number },
): Promise<OpenSkyState | null> {
  const params: Record<string, string | number> = { icao24 };
  if (near) {
    params.lamin = Math.max(near.lat - 1.5, -90);
    params.lamax = Math.min(near.lat + 1.5, 90);
    params.lomin = Math.max(near.lon - 1.5, -180);
    params.lomax = Math.min(near.lon + 1.5, 180);
  }
  const res = await getWithRetry<StatesResponse>(client, '/states/all', { params });
  const raw = res.states?.[0];
  return raw ? toState(raw) : null;
}
