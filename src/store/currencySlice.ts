import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CurrencyPair {
  base: string;
  quote: string;
}

/**
 * Converter preferences. Persisted (see persistence.ts WHITELIST) so favorite
 * pairs and the last-used pair survive restarts — offline included.
 */
export interface CurrencyState {
  /** Most-recent-first, deduped, capped. */
  favoritePairs: CurrencyPair[];
  lastPair: CurrencyPair;
}

const MAX_PAIRS = 8;

const initialState: CurrencyState = {
  favoritePairs: [],
  lastPair: { base: 'USD', quote: 'INR' },
};

const pairKey = (p: CurrencyPair) => `${p.base}-${p.quote}`;

export const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    pairToggled(state, action: PayloadAction<CurrencyPair>) {
      const key = pairKey(action.payload);
      const index = state.favoritePairs.findIndex((p) => pairKey(p) === key);
      if (index >= 0) {
        state.favoritePairs.splice(index, 1);
      } else {
        state.favoritePairs.unshift(action.payload);
        state.favoritePairs = state.favoritePairs.slice(0, MAX_PAIRS);
      }
    },
    pairUsed(state, action: PayloadAction<CurrencyPair>) {
      state.lastPair = action.payload;
    },
  },
});

export const { pairToggled, pairUsed } = currencySlice.actions;

export const selectIsFavoritePair = (
  state: { currency: CurrencyState },
  pair: CurrencyPair,
): boolean => state.currency.favoritePairs.some((p) => pairKey(p) === pairKey(pair));
