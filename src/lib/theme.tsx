import { colorScheme as nativewindColorScheme, useColorScheme } from 'nativewind';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { storage, StorageKeys } from '@/lib/storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  /** User preference: light, dark, or follow the OS. */
  mode: ThemeMode;
  /** What is actually rendered right now (system resolved). */
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    storage.getString(StorageKeys.themeMode).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
        nativewindColorScheme.set(saved);
      }
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    nativewindColorScheme.set(next);
    void storage.setString(StorageKeys.themeMode, next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved: colorScheme ?? 'light', setMode }),
    [mode, colorScheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
