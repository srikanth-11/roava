import { Link, router } from 'expo-router';
import { Database, LogIn, LogOut, Moon, Palette, Sun, UserRound } from 'lucide-react-native';
import { Alert, View } from 'react-native';

import { Badge, Button, Card, Icon, Screen, Text } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { storage, storageEngine, StorageKeys } from '@/lib/storage';
import { useTheme } from '@/lib/theme';
import { signOut } from '@/store/authSlice';

export default function ProfileScreen() {
  const { mode, setMode, resolved } = useTheme();
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.auth.session);

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
            <Text variant="h3">Appearance</Text>
          </View>
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
    </Screen>
  );
}
