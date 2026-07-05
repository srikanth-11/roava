import { createHttpClient, getWithRetry } from '@/services/http';

/** OpenWeather current conditions (free tier: 60 req/min — generous next to GeoDB). */

interface OpenWeatherResponse {
  weather: { id: number; description: string }[];
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
}

const client = createHttpClient({
  baseURL: 'https://api.openweathermap.org/data/2.5',
});

export async function fetchCurrentWeather(lat: number, lon: number): Promise<OpenWeatherResponse> {
  return getWithRetry<OpenWeatherResponse>(client, '/weather', {
    params: {
      lat,
      lon,
      units: 'metric',
      appid: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ?? '',
    },
  });
}

/* ------------------------------------------------------------------ */
/* 5-day / 3-hour forecast — the free tier's only forecast endpoint.   */
/* Daily views must aggregate these buckets client-side (One Call's    */
/* true daily API needs a billing-backed subscription).                */
/* ------------------------------------------------------------------ */

interface ForecastBucketDto {
  /** Bucket start, epoch seconds UTC. */
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number; humidity: number };
  weather: { id: number; description: string }[];
  /** Precipitation probability 0–1. */
  pop: number;
  wind: { speed: number };
}

interface ForecastResponse {
  cnt: number;
  list: ForecastBucketDto[];
  city: {
    /** UTC offset in SECONDS (7200 = UTC+2) — not an IANA zone. */
    timezone: number;
    /** Today's sun times, epoch seconds — powers the sunrise arc. */
    sunrise: number;
    sunset: number;
  };
}

export async function fetchForecast(lat: number, lon: number): Promise<ForecastResponse> {
  return getWithRetry<ForecastResponse>(client, '/forecast', {
    params: {
      lat,
      lon,
      units: 'metric',
      appid: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ?? '',
    },
  });
}

/* ------------------------------------------------------------------ */
/* Air quality — free. aqi is a 1–5 index, not a µg/m³ value.          */
/* ------------------------------------------------------------------ */

interface AirPollutionResponse {
  list: {
    main: { aqi: number };
    components: { pm2_5: number; pm10: number; o3: number; no2: number };
  }[];
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirPollutionResponse> {
  return getWithRetry<AirPollutionResponse>(client, '/air_pollution', {
    params: {
      lat,
      lon,
      appid: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ?? '',
    },
  });
}

export type { AirPollutionResponse, ForecastBucketDto, ForecastResponse };
