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

interface GeoDbCityDetailDto extends GeoDbCityDto {
  region: string | null;
  /** GeoDB ships IANA zones with "__" as separator — e.g. "Europe__Paris". */
  timezone: string | null;
}

interface GeoDbDetailResponse {
  data: GeoDbCityDetailDto;
}

/** Full record for one city — detail screens need coords + timezone. */
export async function fetchCityById(id: string): Promise<GeoDbCityDetailDto> {
  const res = await getWithRetry<GeoDbDetailResponse>(client, `/cities/${id}`);
  return res.data;
}

/** Prefix search. `signal` lets superseded keystrokes abort at the socket. */
export async function searchCities(
  namePrefix: string,
  minPopulation: number,
  signal?: AbortSignal,
): Promise<GeoDbCityDto[]> {
  const res = await getWithRetry<GeoDbListResponse>(client, '/cities', {
    signal,
    params: {
      namePrefix,
      sort: '-population',
      types: 'CITY',
      limit: 8,
      ...(minPopulation > 0 ? { minPopulation } : {}),
    },
  });
  return res.data;
}

export type { GeoDbCityDetailDto, GeoDbCityDto };
