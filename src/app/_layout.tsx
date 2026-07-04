import '../../global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { palette } from '@/lib/palette';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { createAppStore, type AppStore } from '@/store';

// Keep the native splash visible until fonts are ready — prevents a flash of
// fallback-font text on first frame.
void SplashScreen.preventAutoHideAsync();

function ThemedApp() {
  const { resolved } = useTheme();

  return (
    <>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          // Navigator container color — prevents white/black flashes between
          // screens during transitions in the opposite theme.
          contentStyle: { backgroundColor: palette[resolved].background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="destination/[id]" />
      </Stack>
      <OfflineBanner />
    </>
  );
}

export default function RootLayout() {
  const [store, setStore] = useState<AppStore | null>(null);
  const [fontsLoaded] = useFonts({
    'Satoshi-Bold': require('../../assets/fonts/Satoshi-Bold.ttf'),
    'Satoshi-Medium': require('../../assets/fonts/Satoshi-Medium.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Store creation is async: persisted slices rehydrate BEFORE first render,
  // so offline cold starts paint cached data immediately (no flash of empty).
  useEffect(() => {
    void createAppStore().then(setStore);
  }, []);

  const ready = fontsLoaded && store !== null;

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null; // splash stays visible
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </Provider>
  );
}
