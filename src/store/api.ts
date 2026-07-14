import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import { customPoisRepository, type CreateCustomPoiInput } from '@/repositories/customPois';
import { currencyRepository, type CurrencyRate, type RateTable } from '@/repositories/currency';
import { destinationsRepository } from '@/repositories/destinations';
import { flightsRepository, type Flight } from '@/repositories/flights';
import { poisRepository, type Poi } from '@/repositories/pois';
import { searchRepository, type SearchFilters } from '@/repositories/search';
import {
  applyTripCommand,
  tripsRepository,
  type CreateTripInput,
  type TripCommand,
} from '@/repositories/trips';
import { weatherRepository, type FullWeather, type WeatherSnapshot } from '@/repositories/weather';
import { toAppError, type AppError } from '@/services/errors';
import { searchPlaces, type GeoResult } from '@/services/geocode';
import { trendingCached } from '@/store/cacheSlice';
import type { CustomPoi } from '@/types/customPoi';
import type { Destination, DestinationDetail } from '@/types/destination';
import type { Trip } from '@/types/trip';

/** Every queryFn is repository-call → domain data | AppError. One funnel. */
async function run<T>(fn: () => Promise<T>): Promise<{ data: T } | { error: AppError }> {
  try {
    return { data: await fn() };
  } catch (error) {
    return { error: toAppError(error) };
  }
}

/**
 * Endpoints call repositories via queryFn — RTK Query owns caching/lifecycle,
 * repositories own data access. `fakeBaseQuery` because repositories already
 * return domain models; there is no shared base URL at this layer.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<AppError>(),
  tagTypes: ['Trending', 'Trips', 'CustomPois'],
  endpoints: (builder) => ({
    searchDestinations: builder.query<Destination[], { query: string } & SearchFilters>({
      // `signal` aborts superseded requests at the socket when the arg changes.
      queryFn: ({ query, minPopulation }, { signal }) =>
        run(() => searchRepository.searchDestinations(query, { minPopulation }, signal)),
      // Search results are ephemeral — drop them quickly to keep memory lean.
      keepUnusedDataFor: 30,
    }),
    getDestinationById: builder.query<DestinationDetail, string>({
      queryFn: (id) => run(() => destinationsRepository.getDestinationById(id)),
      // Detail is revisited often within a browse session — keep it warm.
      keepUnusedDataFor: 300,
    }),
    getWeather: builder.query<WeatherSnapshot, { lat: number; lon: number }>({
      queryFn: ({ lat, lon }) => run(() => weatherRepository.getCurrent(lat, lon)),
      // Current conditions don't move fast — 10 min saves the free quota.
      keepUnusedDataFor: 600,
    }),
    getFullWeather: builder.query<
      FullWeather,
      { lat: number; lon: number; timezone: string | null }
    >({
      queryFn: ({ lat, lon, timezone }) =>
        run(() => weatherRepository.getFullWeather(lat, lon, timezone)),
      // Repository owns the 30-min disk TTL; RTK just prevents remount churn.
      keepUnusedDataFor: 600,
    }),
    getCurrencyRate: builder.query<CurrencyRate, { base: string; quote: string }>({
      queryFn: ({ base, quote }) => run(() => currencyRepository.getRate(base, quote)),
      // Repository already TTL-caches on disk; RTK just avoids re-entry churn.
      keepUnusedDataFor: 3600,
    }),
    searchFlights: builder.query<{ flights: Flight[]; snapshotAge: number }, string>({
      queryFn: (query) => run(() => flightsRepository.searchByCallsign(query)),
      // The repository's 30s snapshot does the real caching; keep RTK short.
      keepUnusedDataFor: 15,
    }),
    getFlightState: builder.query<Flight | null, { icao24: string; lat?: number; lon?: number }>({
      queryFn: ({ icao24, lat, lon }) =>
        run(() =>
          flightsRepository.getFlight(
            icao24,
            lat !== undefined && lon !== undefined ? { lat, lon } : undefined,
          ),
        ),
      // Always live — polling owns freshness.
      keepUnusedDataFor: 5,
    }),
    getRateTable: builder.query<RateTable, string>({
      queryFn: (base) => run(() => currencyRepository.getRateTable(base)),
      keepUnusedDataFor: 3600,
    }),
    getNearbyPois: builder.query<Poi[], { lat: number; lon: number }>({
      queryFn: ({ lat, lon }) => run(() => poisRepository.getNearby(lat, lon)),
      keepUnusedDataFor: 600,
    }),
    getMapPois: builder.query<Poi[], { lat: number; lon: number }>({
      queryFn: ({ lat, lon }) => run(() => poisRepository.getNearbyForMap(lat, lon)),
      keepUnusedDataFor: 600,
    }),
    getCustomPois: builder.query<CustomPoi[], string>({
      providesTags: (_r, _e, destinationId) => [{ type: 'CustomPois', id: destinationId }],
      queryFn: (destinationId) => run(() => customPoisRepository.getForDestination(destinationId)),
    }),
    addCustomPoi: builder.mutation<CustomPoi, CreateCustomPoiInput>({
      invalidatesTags: (_r, _e, { destinationId }) => [{ type: 'CustomPois', id: destinationId }],
      queryFn: (input) => run(() => customPoisRepository.add(input)),
    }),
    deleteCustomPoi: builder.mutation<null, { id: string; destinationId: string }>({
      invalidatesTags: (_r, _e, { destinationId }) => [{ type: 'CustomPois', id: destinationId }],
      queryFn: ({ id }) =>
        run<null>(async () => {
          await customPoisRepository.remove(id);
          return null;
        }),
    }),
    geocodePlaces: builder.query<GeoResult[], { query: string; lat: number; lon: number }>({
      // `signal` aborts a superseded typeahead request at the socket.
      queryFn: ({ query, lat, lon }, { signal }) =>
        run(() => searchPlaces(query, { lat, lon }, signal)),
      keepUnusedDataFor: 30,
    }),
    getTrips: builder.query<Trip[], void>({
      providesTags: ['Trips'],
      queryFn: () => run(() => tripsRepository.getTrips()),
    }),
    getTrip: builder.query<Trip | null, string>({
      providesTags: (_result, _error, id) => [{ type: 'Trips', id }],
      queryFn: (id) => run(() => tripsRepository.getTrip(id)),
    }),
    createTrip: builder.mutation<Trip, CreateTripInput>({
      invalidatesTags: ['Trips'],
      queryFn: (input) => run(() => tripsRepository.createTrip(input)),
    }),
    deleteTrip: builder.mutation<null, string>({
      invalidatesTags: (_r, _e, id) => ['Trips', { type: 'Trips', id }],
      queryFn: (id) =>
        run<null>(async () => {
          await tripsRepository.deleteTrip(id);
          return null;
        }),
    }),
    updateTrip: builder.mutation<Trip, { tripId: string; command: TripCommand }>({
      invalidatesTags: (_r, _e, { tripId }) => ['Trips', { type: 'Trips', id: tripId }],
      queryFn: ({ tripId, command }) => run(() => applyTripCommand(tripId, command)),
    }),
    getTrending: builder.query<Destination[], void>({
      providesTags: ['Trending'],
      queryFn: (_arg, { dispatch }) =>
        run(async () => {
          const data = await destinationsRepository.getTrending();
          if (data.length > 0) {
            dispatch(trendingCached({ items: data, at: Date.now() }));
          }
          return data;
        }),
    }),
  }),
});

export const {
  useAddCustomPoiMutation,
  useCreateTripMutation,
  useDeleteCustomPoiMutation,
  useDeleteTripMutation,
  useGeocodePlacesQuery,
  useGetCurrencyRateQuery,
  useGetCustomPoisQuery,
  useGetDestinationByIdQuery,
  useGetFlightStateQuery,
  useGetFullWeatherQuery,
  useGetMapPoisQuery,
  useGetNearbyPoisQuery,
  useGetRateTableQuery,
  useGetTrendingQuery,
  useGetTripQuery,
  useGetTripsQuery,
  useGetWeatherQuery,
  useSearchDestinationsQuery,
  useSearchFlightsQuery,
  useUpdateTripMutation,
} = api;
