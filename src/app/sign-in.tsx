import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { AppLogo } from '@/components/shared/AppLogo';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { storage, StorageKeys } from '@/lib/storage';
import { signIn } from '@/store/authSlice';

export default function SignIn() {
  const dispatch = useAppDispatch();
  const { status, errorMessage } = useAppSelector((s) => s.auth);
  const [guestBusy, setGuestBusy] = useState(false);

  // Declarative reaction: whenever a session exists, this screen's job is done.
  useEffect(() => {
    if (status === 'signedIn') {
      router.replace('/home');
    }
  }, [status]);

  const continueAsGuest = async () => {
    setGuestBusy(true);
    await storage.setString(StorageKeys.guestChosen, 'true');
    router.replace('/home');
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <AppLogo size={112} />
        <Text variant="display">Roava</Text>
        <Text variant="body" color="muted" className="text-center">
          Sign in to sync trips and favorites across devices — or explore first.
        </Text>
        {errorMessage ? (
          <Text
            variant="body-sm"
            color="destructive"
            className="text-center"
            accessibilityRole="alert"
          >
            {errorMessage}
          </Text>
        ) : null}
      </View>

      <View className="gap-3 px-8 pb-6">
        <Button
          label="Continue with Google"
          size="lg"
          loading={status === 'signingIn'}
          onPress={() => void dispatch(signIn())}
        />
        <Button
          label="Continue as guest"
          variant="ghost"
          size="lg"
          disabled={guestBusy || status === 'signingIn'}
          onPress={() => void continueAsGuest()}
        />
      </View>
    </Screen>
  );
}
