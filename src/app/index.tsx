import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { storage, StorageKeys } from '@/lib/storage';

/**
 * Entry gate: first launch goes to onboarding, returning users straight to
 * the tab shell. Declarative <Redirect> avoids imperative-navigation races
 * with router mount.
 */
export default function Index() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    storage.getString(StorageKeys.onboardingDone).then((v) => setOnboarded(v === 'true'));
  }, []);

  if (onboarded === null) return null; // splash still covers this frame

  return <Redirect href={onboarded ? '/home' : '/onboarding'} />;
}
