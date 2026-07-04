import { storage } from '@/lib/storage';
import { mockDestinations } from '@/mocks/destinations';
import { toAppError } from '@/services/errors';
import { fetchTopCities } from '@/services/geodb';
import { searchCityPhoto, type CityPhoto } from '@/services/unsplash';
import type { Destination } from '@/types/destination';

/**
 * Data-access contract for destinations. Screens and RTK Query know ONLY this
 * interface — implementations swap freely (mock ↔ live).
 */
export interface DestinationsRepository {
  getTrending(): Promise<Destination[]>;
}

/* ------------------------------------------------------------------ */
/* Live implementation: GeoDB (cities) + Unsplash (imagery)            */
/* ------------------------------------------------------------------ */

const IMAGE_CACHE_PREFIX = 'roava.image-cache.';

async function getCachedPhoto(cityId: string): Promise<CityPhoto | null> {
  const raw = await storage.getString(`${IMAGE_CACHE_PREFIX}${cityId}`);
  return raw ? (JSON.parse(raw) as CityPhoto) : null;
}

/**
 * Unsplash demo tier = 50 req/h. Photos are looked up once per city, then
 * served from AppStorage forever — a refresh with warm image cache costs
 * ZERO Unsplash requests.
 */
async function getPhotoWithCache(cityId: string, cityName: string): Promise<CityPhoto | null> {
  const cached = await getCachedPhoto(cityId);
  if (cached) return cached;
  try {
    const photo = await searchCityPhoto(cityName);
    if (photo) {
      await storage.setString(`${IMAGE_CACHE_PREFIX}${cityId}`, JSON.stringify(photo));
    }
    return photo;
  } catch {
    // Imagery is enhancement, not content — a missing photo never fails the feed.
    return null;
  }
}

export class LiveDestinationsRepository implements DestinationsRepository {
  async getTrending(): Promise<Destination[]> {
    const cities = await fetchTopCities(10);

    return Promise.all(
      cities.map(async (city) => {
        const photo = await getPhotoWithCache(String(city.id), city.city);
        return {
          id: String(city.id),
          name: city.city,
          country: city.country,
          blurb: `${city.country} · ${(city.population / 1_000_000).toFixed(1)}M people`,
          imageUrl: photo?.url ?? null,
          photoCredit: photo?.credit ?? null,
          population: city.population,
        } satisfies Destination;
      }),
    );
  }
}

/* ------------------------------------------------------------------ */
/* Mock implementation (no API keys / dev harness)                     */
/* ------------------------------------------------------------------ */

interface MockBehavior {
  latencyMs: number;
  failNext: 'none' | 'network' | 'server' | 'empty';
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MockDestinationsRepository implements DestinationsRepository {
  private behavior: MockBehavior = { latencyMs: 900, failNext: 'none' };

  setNextBehavior(fail: MockBehavior['failNext'], latencyMs = 900): void {
    this.behavior = { latencyMs, failNext: fail };
  }

  async getTrending(): Promise<Destination[]> {
    await sleep(this.behavior.latencyMs);
    const { failNext } = this.behavior;
    this.behavior = { ...this.behavior, failNext: 'none' };

    if (failNext === 'network') {
      throw toAppError({ isAxiosError: true, message: 'Network Error', code: 'ERR_NETWORK' });
    }
    if (failNext === 'server') {
      throw toAppError({
        isAxiosError: true,
        message: 'Internal Server Error',
        response: { status: 500 },
      });
    }
    if (failNext === 'empty') {
      return [];
    }
    return mockDestinations;
  }
}

/* ------------------------------------------------------------------ */
/* Selection: live when keys exist, mock otherwise                     */
/* ------------------------------------------------------------------ */

const hasLiveKeys =
  !!process.env.EXPO_PUBLIC_GEODB_API_KEY && !!process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

export const destinationsRepository: DestinationsRepository = hasLiveKeys
  ? new LiveDestinationsRepository()
  : new MockDestinationsRepository();

export const destinationsSource = hasLiveKeys ? 'live' : 'mock';
