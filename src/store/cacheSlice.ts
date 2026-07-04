import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Destination } from '@/types/destination';

/**
 * Last-known-good data for offline cold starts. Persisted via AppStorage.
 * Grows a field per feature (weather, rates…) in later phases.
 */
export interface CacheState {
  trending: Destination[];
  trendingCachedAt: number | null;
}

const initialState: CacheState = {
  trending: [],
  trendingCachedAt: null,
};

export const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {
    trendingCached(state, action: PayloadAction<{ items: Destination[]; at: number }>) {
      state.trending = action.payload.items;
      state.trendingCachedAt = action.payload.at;
    },
  },
});

export const { trendingCached } = cacheSlice.actions;
