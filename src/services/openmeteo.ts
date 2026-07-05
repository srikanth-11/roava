import { createHttpClient, getWithRetry } from '@/services/http';

/**
 * Open-Meteo — keyless, no signup, generous limits. Used ONLY for UV index:
 * OpenWeather's free tier has no UV endpoint (One Call requires billing).
 * Verified live: `timezone=auto` resolves the destination's zone server-side.
 */

interface OpenMeteoUvResponse {
  timezone: string;
  daily: { uv_index_max: number[] };
  hourly: { time: string[]; uv_index: number[] };
}

const client = createHttpClient({
  baseURL: 'https://api.open-meteo.com/v1',
});

export async function fetchUvIndex(lat: number, lon: number): Promise<OpenMeteoUvResponse> {
  return getWithRetry<OpenMeteoUvResponse>(client, '/forecast', {
    params: {
      latitude: lat,
      longitude: lon,
      daily: 'uv_index_max',
      hourly: 'uv_index',
      forecast_days: 1,
      timezone: 'auto',
    },
  });
}

export type { OpenMeteoUvResponse };
