import { createHttpClient, getWithRetry } from '@/services/http';

/** GeoDB Cities (RapidAPI free tier: 1 req/s, 1000 req/day). */

interface GeoDbCityDto {
  id: number;
  city: string;
  country: string;
  countryCode: string;
  population: number;
  latitude: number;
  longitude: number;
}

interface GeoDbListResponse {
  data: GeoDbCityDto[];
}

const client = createHttpClient({
  baseURL: 'https://wft-geo-db.p.rapidapi.com/v1/geo',
  headers: {
    'X-RapidAPI-Key': process.env.EXPO_PUBLIC_GEODB_API_KEY ?? '',
    'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
  },
});

/** Most-populous world cities — our "trending" signal until real analytics exist. */
export async function fetchTopCities(limit = 10): Promise<GeoDbCityDto[]> {
  const res = await getWithRetry<GeoDbListResponse>(client, '/cities', {
    params: {
      sort: '-population',
      types: 'CITY',
      limit,
    },
  });
  return res.data;
}

export type { GeoDbCityDto };
