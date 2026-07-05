import '../../global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { palette } from '@/lib/palette';
import { migrateLegacyStorage } from '@/lib/storage';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { createAppStore, type AppStore } from '@/store';
import { restoreSession } from '@/store/authSlice';

// Keep the native splash visible until fonts are ready — prevents a flash of
// fallback-font text on first frame.
void SplashScreen.preventAutoHideAsync();

// Anchor for deep links: a cold `roava://destination/x` builds the stack with
// (tabs) beneath the target, so "back" lands on Home instead of exiting the
// app (closes the JOURNEY 7.3 observation).
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

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
        <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
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
  // Legacy-storage migration runs first (one-time AsyncStorage → MMKV copy),
  // then session restore (SecureStore) kicks off.
  useEffect(() => {
    void migrateLegacyStorage()
      .then(() => createAppStore())
      .then((s) => {
        setStore(s);
        void s.dispatch(restoreSession());
      });
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <ThemedApp />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
