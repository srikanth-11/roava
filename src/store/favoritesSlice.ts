import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Saved destinations. Persisted via AppStorage (see persistence.ts WHITELIST).
 * The shape deliberately carries everything Phase 13's unified favorites UI
 * will render — no refetch needed to draw a favorites list offline.
 */
export interface FavoriteItem {
  id: string;
  name: string;
  country: string;
  imageUrl: string | null;
  photoCredit: string | null;
  savedAt: number;
}

export interface FavoritesState {
  items: FavoriteItem[];
}

const initialState: FavoritesState = {
  items: [],
};

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    favoriteToggled(state, action: PayloadAction<Omit<FavoriteItem, 'savedAt'>>) {
      const index = state.items.findIndex((f) => f.id === action.payload.id);
      if (index >= 0) {
        state.items.splice(index, 1);
      } else {
        state.items.unshift({ ...action.payload, savedAt: Date.now() });
      }
    },
  },
});

export const { favoriteToggled } = favoritesSlice.actions;

export const selectIsFavorite = (state: { favorites: FavoritesState }, id: string): boolean =>
  state.favorites.items.some((f) => f.id === id);
