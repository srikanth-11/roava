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
    getFullWeather: builder.query<
      FullWeather,
      { lat: number; lon: number; timezone: string | null }
    >({
      queryFn: async ({ lat, lon, timezone }) => {
        try {
          return { data: await weatherRepository.getFullWeather(lat, lon, timezone) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
      // Repository owns the 30-min disk TTL; RTK just prevents remount churn.
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
    searchFlights: builder.query<{ flights: Flight[]; snapshotAge: number }, string>({
      queryFn: async (query) => {
        try {
          return { data: await flightsRepository.searchByCallsign(query) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
      // The repository's 30s snapshot does the real caching; keep RTK short.
      keepUnusedDataFor: 15,
    }),
    getFlightState: builder.query<Flight | null, { icao24: string; lat?: number; lon?: number }>({
      queryFn: async ({ icao24, lat, lon }) => {
        try {
          const near = lat !== undefined && lon !== undefined ? { lat, lon } : undefined;
          return { data: await flightsRepository.getFlight(icao24, near) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
      // Always live — polling owns freshness.
      keepUnusedDataFor: 5,
    }),
    getRateTable: builder.query<RateTable, string>({
      queryFn: async (base) => {
        try {
          return { data: await currencyRepository.getRateTable(base) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
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
    getMapPois: builder.query<Poi[], { lat: number; lon: number }>({
      queryFn: async ({ lat, lon }) => {
        try {
          return { data: await poisRepository.getNearbyForMap(lat, lon) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
      keepUnusedDataFor: 600,
    }),
    getCustomPois: builder.query<CustomPoi[], string>({
      providesTags: (_r, _e, destinationId) => [{ type: 'CustomPois', id: destinationId }],
      queryFn: async (destinationId) => {
        try {
          return { data: await customPoisRepository.getForDestination(destinationId) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
    }),
    addCustomPoi: builder.mutation<CustomPoi, CreateCustomPoiInput>({
      invalidatesTags: (_r, _e, { destinationId }) => [{ type: 'CustomPois', id: destinationId }],
      queryFn: async (input) => {
        try {
          return { data: await customPoisRepository.add(input) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
    }),
    deleteCustomPoi: builder.mutation<null, { id: string; destinationId: string }>({
      invalidatesTags: (_r, _e, { destinationId }) => [{ type: 'CustomPois', id: destinationId }],
      queryFn: async ({ id }) => {
        try {
          await customPoisRepository.remove(id);
          return { data: null };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
    }),
    geocodePlaces: builder.query<GeoResult[], { query: string; lat: number; lon: number }>({
      // `signal` aborts a superseded typeahead request at the socket.
      queryFn: async ({ query, lat, lon }, { signal }) => {
        try {
          return { data: await searchPlaces(query, { lat, lon }, signal) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
      keepUnusedDataFor: 30,
    }),
    getTrips: builder.query<Trip[], void>({
      providesTags: ['Trips'],
      queryFn: async () => {
        try {
          return { data: await tripsRepository.getTrips() };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
    }),
    getTrip: builder.query<Trip | null, string>({
      providesTags: (_result, _error, id) => [{ type: 'Trips', id }],
      queryFn: async (id) => {
        try {
          return { data: await tripsRepository.getTrip(id) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
    }),
    createTrip: builder.mutation<Trip, CreateTripInput>({
      invalidatesTags: ['Trips'],
      queryFn: async (input) => {
        try {
          return { data: await tripsRepository.createTrip(input) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
    }),
    deleteTrip: builder.mutation<null, string>({
      invalidatesTags: (_r, _e, id) => ['Trips', { type: 'Trips', id }],
      queryFn: async (id) => {
        try {
          await tripsRepository.deleteTrip(id);
          return { data: null };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
    }),
    updateTrip: builder.mutation<Trip, { tripId: string; command: TripCommand }>({
      invalidatesTags: (_r, _e, { tripId }) => ['Trips', { type: 'Trips', id: tripId }],
      queryFn: async ({ tripId, command }) => {
        try {
          return { data: await applyTripCommand(tripId, command) };
        } catch (error) {
          return { error: toAppError(error) };
        }
      },
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
