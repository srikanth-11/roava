import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { api } from '@/store/api';
import { authSlice } from '@/store/authSlice';
import { cacheSlice } from '@/store/cacheSlice';
import { currencySlice } from '@/store/currencySlice';
import { favoritesSlice } from '@/store/favoritesSlice';
import { loadPersistedState, persistenceListener } from '@/store/persistence';
import { settingsSlice } from '@/store/settingsSlice';

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  cache: cacheSlice.reducer,
  auth: authSlice.reducer,
  favorites: favoritesSlice.reducer,
  currency: currencySlice.reducer,
  settings: settingsSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as RootState | undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(persistenceListener.middleware).concat(api.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

/** Rehydrates persisted slices, then builds the store. Await before first render. */
export async function createAppStore(): Promise<AppStore> {
  const preloaded = await loadPersistedState();
  return makeStore(preloaded);
}
