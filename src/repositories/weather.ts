import { storage } from '@/lib/storage';
import { toAppError } from '@/services/errors';
import { fetchUvIndex } from '@/services/openmeteo';
import {
  fetchAirQuality,
  fetchCurrentWeather,
  fetchForecast,
  type ForecastBucketDto,
  type ForecastResponse,
} from '@/services/openweather';

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

/* ------------------------------------------------------------------ */
/* Full weather (Phase 8): forecast + AQI + UV composed with           */
/* per-source degradation — one failed provider nulls ONE field.       */
/* ------------------------------------------------------------------ */

export interface HourlyBucket {
  /** Bucket start, epoch ms. */
  at: number;
  /** "3 PM" in the destination's zone. */
  hourLabel: string;
  tempC: number;
  kind: WeatherKind;
  /** Precipitation probability 0–100. */
  popPct: number;
}

export interface DailyForecast {
  /** "Today" or weekday name, in the destination's zone. */
  label: string;
  minC: number;
  maxC: number;
  /** Dominant condition — the bucket nearest 13:00 local. */
  kind: WeatherKind;
  /** True when the free tier's 5-day window truncates this day. */
  partial: boolean;
}

export interface AirQuality {
  /** OpenWeather scale 1 (good) – 5 (very poor). */
  aqi: number;
  pm2_5: number;
  pm10: number;
  o3: number;
  no2: number;
}

export interface SunTimes {
  /** Epoch ms. */
  sunrise: number;
  sunset: number;
  /** Display-ready, already in the destination's zone ("6:12 AM"). */
  sunriseLabel: string;
  sunsetLabel: string;
  /** UTC offset seconds from the forecast — arc math fallback when IANA tz is absent. */
  utcOffsetSec: number;
}

export interface FullWeather {
  current: WeatherSnapshot | null;
  hourly: HourlyBucket[] | null;
  daily: DailyForecast[] | null;
  sun: SunTimes | null;
  aqi: AirQuality | null;
  /** Today's max UV index (Open-Meteo). */
  uvMax: number | null;
  fetchedAt: number;
  /** True when served from an expired cache because refresh failed. */
  isStale: boolean;
}

/* ---------- timezone-aware label helpers ---------- */

/**
 * Format an epoch in the destination's zone. Prefers the IANA zone (from
 * GeoDB, already normalized); falls back to shifting by the forecast's UTC
 * offset and formatting as UTC — correct for display, no DST edge within a
 * 5-day window worth the complexity.
 */
function formatInZone(
  epochMs: number,
  tz: string | null,
  utcOffsetSec: number,
  options: Intl.DateTimeFormatOptions,
): string {
  if (tz) {
    try {
      return new Intl.DateTimeFormat('en-US', { ...options, timeZone: tz }).format(epochMs);
    } catch {
      // fall through to offset path
    }
  }
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(
    epochMs + utcOffsetSec * 1000,
  );
}

function localHour(epochMs: number, tz: string | null, utcOffsetSec: number): number {
  return Number(formatInZone(epochMs, tz, utcOffsetSec, { hour: 'numeric', hour12: false }));
}

/* ---------- forecast bucket mapping ---------- */

function toHourly(buckets: ForecastBucketDto[], tz: string | null, offset: number): HourlyBucket[] {
  return buckets.slice(0, 8).map((b) => ({
    at: b.dt * 1000,
    hourLabel: formatInZone(b.dt * 1000, tz, offset, { hour: 'numeric' }),
    tempC: b.main.temp,
    kind: b.weather[0] ? kindFromConditionId(b.weather[0].id) : 'clouds',
    popPct: Math.round(b.pop * 100),
  }));
}

function toDaily(res: ForecastResponse, tz: string | null): DailyForecast[] {
  const offset = res.city.timezone;
  const byDay = new Map<string, ForecastBucketDto[]>();
  for (const b of res.list) {
    const key = formatInZone(b.dt * 1000, tz, offset, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const group = byDay.get(key);
    if (group) group.push(b);
    else byDay.set(key, [b]);
  }

  const days = [...byDay.entries()];
  return days.map(([, buckets], index) => {
    // Dominant condition = bucket nearest 13:00 local — midday defines the day.
    const midday = buckets.reduce((best, b) =>
      Math.abs(localHour(b.dt * 1000, tz, offset) - 13) <
      Math.abs(localHour(best.dt * 1000, tz, offset) - 13)
        ? b
        : best,
    );
    return {
      label:
        index === 0 ? 'Today' : formatInZone(midday.dt * 1000, tz, offset, { weekday: 'long' }),
      minC: Math.min(...buckets.map((b) => b.main.temp_min)),
      maxC: Math.max(...buckets.map((b) => b.main.temp_max)),
      kind: midday.weather[0] ? kindFromConditionId(midday.weather[0].id) : 'clouds',
      // 8 buckets = a full day; the window's last day usually truncates.
      partial: index === days.length - 1 && buckets.length < 8,
    };
  });
}

/* ---------- cache (TTL + stale-if-error, mirrors currency.ts) ---------- */

const CACHE_PREFIX = 'roava.weather.';
const TTL_MS = 30 * 60 * 1000;

type CachedWeather = Omit<FullWeather, 'isStale'>;

function cacheKey(lat: number, lon: number): string {
  return `${CACHE_PREFIX}${lat.toFixed(3)},${lon.toFixed(3)}`;
}

async function readCache(key: string): Promise<CachedWeather | null> {
  try {
    const raw = await storage.getString(key);
    return raw ? (JSON.parse(raw) as CachedWeather) : null;
  } catch {
    return null;
  }
}

/* ---------- repository ---------- */

export interface WeatherRepository {
  /** Phase 7 snapshot card. */
  getCurrent(lat: number, lon: number): Promise<WeatherSnapshot>;
  /** Phase 8 weather screen. */
  getFullWeather(lat: number, lon: number, timezone: string | null): Promise<FullWeather>;
}

function toSnapshot(res: Awaited<ReturnType<typeof fetchCurrentWeather>>): WeatherSnapshot {
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

class LiveWeatherRepository implements WeatherRepository {
  async getCurrent(lat: number, lon: number): Promise<WeatherSnapshot> {
    return toSnapshot(await fetchCurrentWeather(lat, lon));
  }

  async getFullWeather(lat: number, lon: number, timezone: string | null): Promise<FullWeather> {
    const key = cacheKey(lat, lon);
    const cached = await readCache(key);
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
      return { ...cached, isStale: false };
    }

    // allSettled: each provider fails alone — a dead AQI never kills the rail.
    const [currentR, forecastR, aqiR, uvR] = await Promise.allSettled([
      fetchCurrentWeather(lat, lon),
      fetchForecast(lat, lon),
      fetchAirQuality(lat, lon),
      fetchUvIndex(lat, lon),
    ]);

    const forecast = forecastR.status === 'fulfilled' ? forecastR.value : null;
    const result: CachedWeather = {
      current: currentR.status === 'fulfilled' ? toSnapshot(currentR.value) : null,
      hourly: forecast ? toHourly(forecast.list, timezone, forecast.city.timezone) : null,
      daily: forecast ? toDaily(forecast, timezone) : null,
      sun: forecast
        ? {
            sunrise: forecast.city.sunrise * 1000,
            sunset: forecast.city.sunset * 1000,
            sunriseLabel: formatInZone(
              forecast.city.sunrise * 1000,
              timezone,
              forecast.city.timezone,
              {
                hour: 'numeric',
                minute: '2-digit',
              },
            ),
            sunsetLabel: formatInZone(
              forecast.city.sunset * 1000,
              timezone,
              forecast.city.timezone,
              {
                hour: 'numeric',
                minute: '2-digit',
              },
            ),
            utcOffsetSec: forecast.city.timezone,
          }
        : null,
      aqi:
        aqiR.status === 'fulfilled' && aqiR.value.list[0]
          ? {
              aqi: aqiR.value.list[0].main.aqi,
              pm2_5: aqiR.value.list[0].components.pm2_5,
              pm10: aqiR.value.list[0].components.pm10,
              o3: aqiR.value.list[0].components.o3,
              no2: aqiR.value.list[0].components.no2,
            }
          : null,
      uvMax: uvR.status === 'fulfilled' ? (uvR.value.daily.uv_index_max[0] ?? null) : null,
      fetchedAt: Date.now(),
    };

    const anySource = result.current || result.hourly || result.aqi || result.uvMax !== null;
    if (anySource) {
      await storage.setString(key, JSON.stringify(result));
      return { ...result, isStale: false };
    }

    // Every provider failed: an expired cache beats nothing — labeled honestly.
    if (cached) return { ...cached, isStale: true };
    throw toAppError(
      forecastR.status === 'rejected' ? forecastR.reason : new Error('all weather sources failed'),
    );
  }
}

/* ---------- mock ---------- */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class MockWeatherRepository implements WeatherRepository {
  async getCurrent(): Promise<WeatherSnapshot> {
    await sleep(500);
    return {
      tempC: 22.4,
      feelsLikeC: 22.1,
      description: 'scattered clouds',
      kind: 'clouds',
      humidityPct: 48,
      windMs: 3.2,
    };
  }

  async getFullWeather(): Promise<FullWeather> {
    await sleep(700);
    const now = Date.now();
    const hour = 3 * 60 * 60 * 1000;
    const kinds: WeatherKind[] = [
      'clear',
      'clear',
      'clouds',
      'clouds',
      'rain',
      'rain',
      'clouds',
      'clear',
    ];
    return {
      current: await this.getCurrent(),
      hourly: kinds.map((kind, i) => ({
        at: now + i * hour,
        hourLabel: new Intl.DateTimeFormat('en-US', { hour: 'numeric' }).format(now + i * hour),
        tempC: 20 + Math.sin(i / 2) * 6,
        kind,
        popPct: kind === 'rain' ? 60 : 10,
      })),
      daily: ['Today', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].map((label, i) => ({
        label,
        minC: 16 + i,
        maxC: 26 + (i % 3),
        kind: kinds[i + 2] ?? 'clear',
        partial: i === 4,
      })),
      sun: {
        sunrise: now - 6 * hour,
        sunset: now + 4 * hour,
        sunriseLabel: '6:12 AM',
        sunsetLabel: '8:45 PM',
        utcOffsetSec: 0,
      },
      aqi: { aqi: 2, pm2_5: 8.1, pm10: 14.2, o3: 61.5, no2: 12.3 },
      uvMax: 6.4,
      fetchedAt: now,
      isStale: false,
    };
  }
}

export const weatherRepository: WeatherRepository = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY
  ? new LiveWeatherRepository()
  : new MockWeatherRepository();
