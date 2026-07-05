import { fetchAllStates, fetchStateByIcao24, type OpenSkyState } from '@/services/opensky';

export type Flight = OpenSkyState;

/** Instantaneous phase derived honestly from ADS-B state — no fake gate data. */
export type FlightPhase = 'on-ground' | 'climbing' | 'cruising' | 'descending';

export function phaseOf(flight: Flight): FlightPhase {
  if (flight.onGround) return 'on-ground';
  const vr = flight.verticalRateMs ?? 0;
  if (vr > 1.5) return 'climbing';
  if (vr < -1.5) return 'descending';
  return 'cruising';
}

/**
 * Snapshot cache: in MEMORY, 30 s TTL — deliberately NOT disk. Live positions
 * rot in seconds; persisting them would serve confidently wrong data offline.
 * (Contrast: currency tables get 12 h on disk. Cache duration and medium
 * follow the data's freshness semantics.)
 */
const SNAPSHOT_TTL_MS = 30_000;

let snapshot: { states: Flight[]; fetchedAt: number } | null = null;

/**
 * Last known position per aircraft — feeds the 1-credit bbox on the NEXT
 * poll. Lives HERE (not in React state) so the poll's query key stays stable:
 * putting a moving position into the RTK arg changes the cache key on every
 * fix and loops the screen (verified the hard way, JOURNEY pending).
 */
const lastPositions = new Map<string, { lat: number; lon: number }>();

export interface FlightsRepository {
  /** Case-insensitive callsign prefix search over one cached global snapshot. */
  searchByCallsign(query: string): Promise<{ flights: Flight[]; snapshotAge: number }>;
  /** Fresh single-aircraft state — bbox'd to 1 credit when `near` is known. */
  getFlight(icao24: string, near?: { lat: number; lon: number }): Promise<Flight | null>;
}

class LiveFlightsRepository implements FlightsRepository {
  async searchByCallsign(query: string): Promise<{ flights: Flight[]; snapshotAge: number }> {
    if (!snapshot || Date.now() - snapshot.fetchedAt > SNAPSHOT_TTL_MS) {
      const { states } = await fetchAllStates();
      snapshot = { states, fetchedAt: Date.now() };
    }
    const q = query.trim().toUpperCase();
    const flights = snapshot.states
      .filter((f) => f.callsign.toUpperCase().startsWith(q) && f.callsign.length > 0)
      .slice(0, 25);
    return { flights, snapshotAge: Date.now() - snapshot.fetchedAt };
  }

  async getFlight(icao24: string, near?: { lat: number; lon: number }): Promise<Flight | null> {
    const hint = lastPositions.get(icao24) ?? near;
    const state = await fetchStateByIcao24(icao24, hint);
    if (state && state.lat !== null && state.lon !== null) {
      lastPositions.set(icao24, { lat: state.lat, lon: state.lon });
    }
    return state;
  }
}

export const flightsRepository: FlightsRepository = new LiveFlightsRepository();
