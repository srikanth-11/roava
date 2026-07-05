import { storage } from '@/lib/storage';
import { toAppError } from '@/services/errors';
import { fetchRates } from '@/services/exchangeRates';

/**
 * Exchange rate with stale-if-error semantics — the Phase 10 flagship pattern
 * in miniature: fresh cache → serve; expired cache → refetch; refetch fails →
 * serve the expired value, honestly labeled.
 */

export interface CurrencyRate {
  /** Destination currency (the base: 1 EUR = …). */
  base: string;
  /** Home currency (the quote: … INR). */
  quote: string;
  rate: number;
  fetchedAt: number;
  /** True when this is an expired value served because refresh failed. */
  isStale: boolean;
}

const CACHE_PREFIX = 'roava.fx.';
const TTL_MS = 12 * 60 * 60 * 1000; // rates refresh daily upstream — 12h is plenty

type CachedRate = Omit<CurrencyRate, 'isStale'>;

async function readCache(key: string): Promise<CachedRate | null> {
  try {
    const raw = await storage.getString(key);
    return raw ? (JSON.parse(raw) as CachedRate) : null;
  } catch {
    return null;
  }
}

export interface CurrencyRepository {
  getRate(base: string, quote: string): Promise<CurrencyRate>;
}

class LiveCurrencyRepository implements CurrencyRepository {
  async getRate(base: string, quote: string): Promise<CurrencyRate> {
    const key = `${CACHE_PREFIX}${base}-${quote}`;
    const cached = await readCache(key);

    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
      return { ...cached, isStale: false };
    }

    try {
      const res = await fetchRates(base);
      const rate = res.rates[quote];
      if (rate === undefined) {
        throw new Error(`er-api has no ${quote} rate for base ${base}`);
      }
      const fresh: CachedRate = { base, quote, rate, fetchedAt: Date.now() };
      await storage.setString(key, JSON.stringify(fresh));
      return { ...fresh, isStale: false };
    } catch (error) {
      // Stale-if-error: an old rate beats no rate — as long as we say so.
      if (cached) return { ...cached, isStale: true };
      throw toAppError(error);
    }
  }
}

export const currencyRepository: CurrencyRepository = new LiveCurrencyRepository();
