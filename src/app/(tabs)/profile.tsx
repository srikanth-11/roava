import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import Constants from 'expo-constants';
import { Link, router } from 'expo-router';
import {
  Banknote,
  ChevronRight,
  Database,
  Info,
  LogIn,
  LogOut,
  Moon,
  Palette,
  Sun,
  UserRound,
} from 'lucide-react-native';
import { useRef } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Badge, Button, Card, Icon, Screen, Text } from '@/components/ui';
import { CurrencyPickerSheet } from '@/features/currency/CurrencyPickerSheet';
import { OfflineDataCard } from '@/features/settings/OfflineDataCard';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { hapticLight } from '@/lib/haptics';
import { storage, storageEngine, StorageKeys } from '@/lib/storage';
import { useTheme } from '@/lib/theme';
import { signOut } from '@/store/authSlice';
import { homeCurrencyChanged, selectHomeCurrency } from '@/store/settingsSlice';

/** Every free API that powers the app gets its credit. */
const ATTRIBUTIONS = [
  'City data — GeoDB Cities',
  'Photos — Unsplash (per-photo credits shown in app)',
  'Weather & air quality — OpenWeather',
  'UV index — Open-Meteo',
  'Sights — OpenStreetMap via Overpass (© OpenStreetMap contributors)',
  'Map tiles — OpenFreeMap (© OpenStreetMap contributors)',
  'Exchange rates — open.er-api.com',
  'Live flights — The OpenSky Network',
];

export default function ProfileScreen() {
  const { mode, setMode, resolved } = useTheme();
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.auth.session);
  const homeCurrency = useAppSelector(selectHomeCurrency);
  const currencySheetRef = useRef<BottomSheetModal>(null);

  const onPickHomeCurrency = (code: string) => {
    hapticLight();
    dispatch(homeCurrencyChanged(code));
    currencySheetRef.current?.dismiss();
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Your trips and favorites stay on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void storage.delete(StorageKeys.guestChosen);
          void dispatch(signOut()).then(() => router.replace('/sign-in'));
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <View className="gap-4 px-4 pt-4">
        <Text variant="h1">Profile</Text>

        <Card>
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {session ? (
                <Text variant="h3" color="primary">
                  {session.user.name.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Icon icon={UserRound} color="primary" />
              )}
            </View>
            <View className="flex-1">
              <Text variant="h3">{session ? session.user.name : 'Guest traveler'}</Text>
              <Text variant="body-sm" color="muted">
                {session ? session.user.email : 'Sign in to sync across devices'}
              </Text>
            </View>
            {session ? (
              <Badge
                label={session.provider}
                variant={session.provider === 'google' ? 'success' : 'outline'}
              />
            ) : null}
          </View>
          <View className="mt-4">
            {session ? (
              <Button
                label="Sign out"
                variant="outline"
                size="sm"
                icon={LogOut}
                onPress={confirmSignOut}
              />
            ) : (
              <Button
                label="Sign in"
                size="sm"
                icon={LogIn}
                onPress={() => router.push('/sign-in')}
              />
            )}
          </View>
        </Card>

        <Card>
          <View className="mb-3 flex-row items-center gap-2">
            <Icon icon={resolved === 'dark' ? Moon : Sun} color="muted" />
            <Text variant="h3">Preferences</Text>
          </View>
          <Text variant="caption" color="muted" className="mb-2">
            Theme
          </Text>
          <View className="flex-row gap-2">
            {(['light', 'dark', 'system'] as const).map((m) => (
              <Button
                key={m}
                label={m}
                size="sm"
                variant={mode === m ? 'primary' : 'outline'}
                onPress={() => setMode(m)}
              />
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Home currency, currently ${homeCurrency}`}
            accessibilityHint="Opens the currency picker"
            onPress={() => currencySheetRef.current?.present()}
            className="mt-4 flex-row items-center gap-3 rounded-md border border-border p-3 active:opacity-90"
          >
            <Icon icon={Banknote} color="muted" size={20} />
            <View className="flex-1">
              <Text variant="label">Home currency</Text>
              <Text variant="caption" color="muted">
                Conversions and budgets default to this
              </Text>
            </View>
            <Badge label={homeCurrency} variant="outline" />
            <Icon icon={ChevronRight} color="muted" size={16} />
          </Pressable>
        </Card>

        <OfflineDataCard />

        <Card>
          <View className="mb-3 flex-row items-center gap-2">
            <Icon icon={Info} color="muted" />
            <Text variant="h3">About</Text>
          </View>
          <View className="gap-1">
            {ATTRIBUTIONS.map((line) => (
              <Text key={line} variant="caption" color="muted">
                {line}
              </Text>
            ))}
          </View>
          <Text variant="caption" color="muted" className="mt-3">
            Roava {Constants.expoConfig?.version ?? 'dev'} · data stays on this device
          </Text>
        </Card>

        {__DEV__ ? (
          <View className="gap-2">
            <Badge label={`storage: ${storageEngine}`} variant="outline" />
            <Link href="/dev-gallery" asChild>
              <Button label="Component gallery" variant="outline" icon={Palette} />
            </Link>
            <Link href="/dev-data" asChild>
              <Button label="Data layer demo" variant="outline" icon={Database} />
            </Link>
          </View>
        ) : null}
      </View>

      <CurrencyPickerSheet
        ref={currencySheetRef}
        label="Home currency"
        selected={homeCurrency}
        onSelect={onPickHomeCurrency}
      />
    </Screen>
  );
}
