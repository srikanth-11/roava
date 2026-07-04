import { storage } from '@/lib/storage';
import { mockDestinations } from '@/mocks/destinations';
import { searchCities } from '@/services/geodb';
import type { Destination } from '@/types/destination';

export interface SearchFilters {
  /** 0 = any size */
  minPopulation: number;
}

export interface SearchRepository {
  searchDestinations(
    query: string,
    filters: SearchFilters,
    signal?: AbortSignal,
  ): Promise<Destination[]>;
}

class LiveSearchRepository implements SearchRepository {
  async searchDestinations(
    query: string,
    filters: SearchFilters,
    signal?: AbortSignal,
  ): Promise<Destination[]> {
    const cities = await searchCities(query, filters.minPopulation, signal);
    return cities.map((city) => ({
      id: String(city.id),
      name: city.city,
      country: city.country,
      blurb:
        city.population > 0
          ? `${city.country} · ${(city.population / 1_000_000).toFixed(1)}M people`
          : city.country,
      imageUrl: null, // search rows are icon rows — imagery stays on detail/home (quota discipline)
      photoCredit: null,
      population: city.population,
    }));
  }
}

class MockSearchRepository implements SearchRepository {
  async searchDestinations(query: string, filters: SearchFilters): Promise<Destination[]> {
    await new Promise((r) => setTimeout(r, 400));
    const q = query.toLowerCase();
    return mockDestinations.filter(
      (d) =>
        d.name.toLowerCase().startsWith(q) &&
        (filters.minPopulation === 0 || (d.population ?? 0) >= filters.minPopulation),
    );
  }
}

export const searchRepository: SearchRepository = process.env.EXPO_PUBLIC_GEODB_API_KEY
  ? new LiveSearchRepository()
  : new MockSearchRepository();

/* ------------------------------------------------------------------ */
/* Search history — AppStorage, max 10, most-recent-first              */
/* ------------------------------------------------------------------ */

const HISTORY_KEY = 'roava.search-history';
const HISTORY_MAX = 10;

export interface HistoryEntry {
  id: string;
  name: string;
  country: string;
}

export async function getSearchHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await storage.getString(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export async function addToSearchHistory(entry: HistoryEntry): Promise<HistoryEntry[]> {
  const current = await getSearchHistory();
  const next = [entry, ...current.filter((e) => e.id !== entry.id)].slice(0, HISTORY_MAX);
  await storage.setString(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export async function clearSearchHistory(): Promise<void> {
  await storage.delete(HISTORY_KEY);
}
