import { createHttpClient, getWithRetry } from '@/services/http';

/**
 * Unsplash (demo tier: 50 req/h — callers MUST cache results).
 * Attribution requirement: photographer name must be rendered wherever the
 * photo appears; we surface it as `credit`.
 */

interface UnsplashPhotoDto {
  urls: { regular: string; small: string };
  user: { name: string };
}

interface UnsplashSearchResponse {
  results: UnsplashPhotoDto[];
}

const client = createHttpClient({
  baseURL: 'https://api.unsplash.com',
  headers: {
    Authorization: `Client-ID ${process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY ?? ''}`,
  },
});

export interface CityPhoto {
  /** `small` (400w) — cards and rows. */
  url: string;
  /** `regular` (1080w) — full-width heroes. Optional: entries cached before Phase 7 lack it. */
  heroUrl?: string;
  credit: string;
}

export async function searchCityPhoto(query: string): Promise<CityPhoto | null> {
  const res = await getWithRetry<UnsplashSearchResponse>(client, '/search/photos', {
    params: {
      query: `${query} city travel`,
      per_page: 1,
      orientation: 'landscape',
      content_filter: 'high',
    },
  });
  const photo = res.results[0];
  if (!photo) return null;
  return { url: photo.urls.small, heroUrl: photo.urls.regular, credit: photo.user.name };
}
