import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * App-wide connectivity signal. `null` while unknown (first read in flight) —
 * callers should treat null as "assume online" to avoid a false offline flash.
 */
export function useOnline(): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable can be null while probing — only trust `false`.
      setOnline(state.isConnected === true && state.isInternetReachable !== false);
    });
    return unsubscribe;
  }, []);

  return online;
}
