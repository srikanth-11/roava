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
