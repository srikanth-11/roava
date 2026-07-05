import { fetchCurrentWeather } from '@/services/openweather';

/** Domain grouping of OpenWeather's ~50 condition codes — the UI keys icons off this. */
export type WeatherKind = 'thunder' | 'rain' | 'snow' | 'mist' | 'clear' | 'clouds';

export interface WeatherSnapshot {
  tempC: number;
  feelsLikeC: number;
  /** Lowercase phrase from the API ("clear sky"). */
  description: string;
  kind: WeatherKind;
  humidityPct: number;
  windMs: number;
}

/** OpenWeather ids: 2xx thunder, 3xx/5xx rain, 6xx snow, 7xx atmosphere, 800 clear, 80x clouds. */
function kindFromConditionId(id: number): WeatherKind {
  if (id < 300) return 'thunder';
  if (id < 600) return 'rain';
  if (id < 700) return 'snow';
  if (id < 800) return 'mist';
  if (id === 800) return 'clear';
  return 'clouds';
}

export interface WeatherRepository {
  getCurrent(lat: number, lon: number): Promise<WeatherSnapshot>;
}

class LiveWeatherRepository implements WeatherRepository {
  async getCurrent(lat: number, lon: number): Promise<WeatherSnapshot> {
    const res = await fetchCurrentWeather(lat, lon);
    const condition = res.weather[0];
    return {
      tempC: res.main.temp,
      feelsLikeC: res.main.feels_like,
      description: condition?.description ?? '—',
      kind: condition ? kindFromConditionId(condition.id) : 'clouds',
      humidityPct: res.main.humidity,
      windMs: res.wind.speed,
    };
  }
}

class MockWeatherRepository implements WeatherRepository {
  async getCurrent(): Promise<WeatherSnapshot> {
    await new Promise((r) => setTimeout(r, 500));
    return {
      tempC: 22.4,
      feelsLikeC: 22.1,
      description: 'scattered clouds',
      kind: 'clouds',
      humidityPct: 48,
      windMs: 3.2,
    };
  }
}

export const weatherRepository: WeatherRepository = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY
  ? new LiveWeatherRepository()
  : new MockWeatherRepository();
