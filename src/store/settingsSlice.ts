import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_HOME_CURRENCY } from '@/lib/currencies';

/**
 * User preferences that ripple through features (unlike theme, which lives in
 * its own pre-store context). Persisted via the WHITELIST like favorites.
 */
export interface SettingsState {
  /** ISO-4217 code conversions and budgets default to. */
  homeCurrency: string;
}

const initialState: SettingsState = {
  homeCurrency: DEFAULT_HOME_CURRENCY,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    homeCurrencyChanged(state, action: PayloadAction<string>) {
      state.homeCurrency = action.payload;
    },
  },
});

export const { homeCurrencyChanged } = settingsSlice.actions;

export const selectHomeCurrency = (state: { settings: SettingsState }): string =>
  state.settings.homeCurrency;
