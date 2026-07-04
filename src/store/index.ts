import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { api } from '@/store/api';
import { cacheSlice } from '@/store/cacheSlice';
import { loadPersistedState, persistenceListener } from '@/store/persistence';

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  cache: cacheSlice.reducer,
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
