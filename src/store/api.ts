import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import { destinationsRepository } from '@/repositories/destinations';
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

export const { useGetTrendingQuery } = api;
