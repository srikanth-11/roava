import { cachedJson } from '@/lib/cache';
import { fetchRates } from '@/services/exchangeRates';

/**
 * Exchange rate with stale-if-error semantics — the Phase 10 flagship pattern
 * in miniature: fresh cache → serve; expired cache → refetch; refetch fails →
 * serve the expired value, honestly labeled. `cachedJson` owns the mechanics.
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

/** A full rate table for one base — er-api returns ~160 quotes per call. */
export interface RateTable {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
  /** True when this is an expired table served because refresh failed. */
  isStale: boolean;
}

const CACHE_PREFIX = 'roava.fx.';
const TABLE_CACHE_PREFIX = 'roava.fx-table.';
const TTL_MS = 12 * 60 * 60 * 1000; // rates refresh daily upstream — 12h is plenty

export const currencyRepository = {
  getRate(base: string, quote: string): Promise<CurrencyRate> {
    return cachedJson(`${CACHE_PREFIX}${base}-${quote}`, TTL_MS, async () => {
      const res = await fetchRates(base);
      const rate = res.rates[quote];
      if (rate === undefined) {
        throw new Error(`er-api has no ${quote} rate for base ${base}`);
      }
      return { base, quote, rate, fetchedAt: Date.now() };
    });
  },

  /**
   * Whole-table variant for the converter: one cached table converts the base
   * to ANYTHING offline. Same TTL + stale-if-error contract as getRate.
   */
  getRateTable(base: string): Promise<RateTable> {
    return cachedJson(`${TABLE_CACHE_PREFIX}${base}`, TTL_MS, async () => {
      const res = await fetchRates(base);
      return { base, rates: res.rates, fetchedAt: Date.now() };
    });
  },
};
