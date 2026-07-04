import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAppSelector } from '@/hooks/useAppStore';
import { storage, StorageKeys } from '@/lib/storage';

/**
 * Entry gate:
 *   first launch            → onboarding
 *   no session, no choice   → sign-in
 *   session or guest chosen → tabs
 * Declarative <Redirect>; waits for SecureStore session restore to settle.
 */
export default function Index() {
  const authStatus = useAppSelector((s) => s.auth.status);
  const [flags, setFlags] = useState<{ onboarded: boolean; guest: boolean } | null>(null);

  useEffect(() => {
    void Promise.all([
      storage.getString(StorageKeys.onboardingDone),
      storage.getString(StorageKeys.guestChosen),
    ]).then(([onboarded, guest]) => {
      setFlags({ onboarded: onboarded === 'true', guest: guest === 'true' });
    });
  }, []);

  if (flags === null || authStatus === 'restoring') return null; // splash covers this

  if (!flags.onboarded) return <Redirect href="/onboarding" />;
  if (authStatus === 'signedIn' || flags.guest) return <Redirect href="/home" />;
  return <Redirect href="/sign-in" />;
}
