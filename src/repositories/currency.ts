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
const TABLE_CACHE_PREFIX = 'roava.fx-table.';
const TTL_MS = 12 * 60 * 60 * 1000; // rates refresh daily upstream — 12h is plenty

type CachedRate = Omit<CurrencyRate, 'isStale'>;
type CachedTable = Omit<RateTable, 'isStale'>;

async function readCache(key: string): Promise<CachedRate | null> {
  try {
    const raw = await storage.getString(key);
    return raw ? (JSON.parse(raw) as CachedRate) : null;
  } catch {
    return null;
  }
}

async function readTableCache(key: string): Promise<CachedTable | null> {
  try {
    const raw = await storage.getString(key);
    return raw ? (JSON.parse(raw) as CachedTable) : null;
  } catch {
    return null;
  }
}

/** A full rate table for one base — er-api returns ~160 quotes per call. */
export interface RateTable {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
  /** True when this is an expired table served because refresh failed. */
  isStale: boolean;
}

export interface CurrencyRepository {
  getRate(base: string, quote: string): Promise<CurrencyRate>;
  /**
   * Whole-table variant for the converter: one cached table converts the base
   * to ANYTHING offline. Same TTL + stale-if-error contract as getRate.
   */
  getRateTable(base: string): Promise<RateTable>;
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

  async getRateTable(base: string): Promise<RateTable> {
    const key = `${TABLE_CACHE_PREFIX}${base}`;
    const cached = await readTableCache(key);

    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
      return { ...cached, isStale: false };
    }

    try {
      const res = await fetchRates(base);
      const fresh: CachedTable = { base, rates: res.rates, fetchedAt: Date.now() };
      await storage.setString(key, JSON.stringify(fresh));
      return { ...fresh, isStale: false };
    } catch (error) {
      if (cached) return { ...cached, isStale: true };
      throw toAppError(error);
    }
  }
}

export const currencyRepository: CurrencyRepository = new LiveCurrencyRepository();
