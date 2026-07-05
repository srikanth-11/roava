import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import { currencyRepository, type CurrencyRate } from '@/repositories/currency';
import { destinationsRepository } from '@/repositories/destinations';
import { poisRepository, type Poi } from '@/repositories/pois';
import { searchRepository, type SearchFilters } from '@/repositories/search';
import { weatherRepository, type WeatherSnapshot } from '@/repositories/weather';
import { toAppError, type AppError } from '@/services/errors';
import { trendingCached } from '@/store/cacheSlice';
import type { Destination, DestinationDetail } from '@/types/destination';

/**
 * Endpoints call repositories via queryFn — RTK Query owns caching/lifecycle,
 * repositories own data access. `fakeBaseQuery` because repositories already
 * return domain models; there is no shared base URL at this layer.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<AppError>(),
  tagTypes: ['Trending'],
  endpoints: (builder) => ({
    searchDestinations: builder.query<Destination[], { query: string } & SearchFilters>({
      // `signal` aborts superseded requests at the socket when the arg changes.
      queryFn: async ({ query, minPopulation }, { signal }) => {
        try {
          const data = await searchRepository.searchDestinations(query, { minPopulation }, signal);
          return { data };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
      // Search results are ephemeral — drop them quickly to keep memory lean.
      keepUnusedDataFor: 30,
    }),
    getDestinationById: builder.query<DestinationDetail, string>({
      queryFn: async (id) => {
        try {
          const data = await destinationsRepository.getDestinationById(id);
          return { data };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
      // Detail is revisited often within a browse session — keep it warm.
      keepUnusedDataFor: 300,
    }),
    getWeather: builder.query<WeatherSnapshot, { lat: number; lon: number }>({
      queryFn: async ({ lat, lon }) => {
        try {
          return { data: await weatherRepository.getCurrent(lat, lon) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
      // Current conditions don't move fast — 10 min saves the free quota.
      keepUnusedDataFor: 600,
    }),
    getCurrencyRate: builder.query<CurrencyRate, { base: string; quote: string }>({
      queryFn: async ({ base, quote }) => {
        try {
          return { data: await currencyRepository.getRate(base, quote) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
      // Repository already TTL-caches on disk; RTK just avoids re-entry churn.
      keepUnusedDataFor: 3600,
    }),
    getNearbyPois: builder.query<Poi[], { lat: number; lon: number }>({
      queryFn: async ({ lat, lon }) => {
        try {
          return { data: await poisRepository.getNearby(lat, lon) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
      keepUnusedDataFor: 600,
    }),
    getTrending: builder.query<Destination[], void>({
      providesTags: ['Trending'],
      queryFn: async (_arg, { dispatch }) => {
        try {
          const data = await destinationsRepository.getTrending();
          if (data.length > 0) {
            dispatch(trendingCached({ items: data, at: Date.now() }));
          }
          return { data };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
    }),
  }),
});

export const {
  useGetCurrencyRateQuery,
  useGetDestinationByIdQuery,
  useGetNearbyPoisQuery,
  useGetTrendingQuery,
  useGetWeatherQuery,
  useSearchDestinationsQuery,
} = api;
