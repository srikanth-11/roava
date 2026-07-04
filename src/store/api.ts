import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import { destinationsRepository } from '@/repositories/destinations';
import { searchRepository, type SearchFilters } from '@/repositories/search';
import { toAppError, type AppError } from '@/services/errors';
import { trendingCached } from '@/store/cacheSlice';
import type { Destination } from '@/types/destination';

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

export const { useGetTrendingQuery, useSearchDestinationsQuery } = api;
