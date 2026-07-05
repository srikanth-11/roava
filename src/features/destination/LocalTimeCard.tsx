import { Moon, Sun } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { SnapshotCard } from '@/components/shared/SnapshotCard';

interface LocalClock {
  time: string;
  weekday: string;
  hour: number;
}

/**
 * Pure client computation — the one snapshot with zero API cost. Hermes ships
 * full Intl on Android, so `timeZone` formatting works offline.
 */
function useLocalClock(timezone: string | null): LocalClock | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  return useMemo(() => {
    if (!timezone) return null;
    try {
      const d = new Date(now);
      const time = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezone,
      }).format(d);
      const weekday = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone: timezone,
      }).format(d);
      const hour = Number(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hour12: false,
          timeZone: timezone,
        }).format(d),
      );
      return { time, weekday, hour };
    } catch {
      // Unknown zone id → the card degrades, the row survives.
      return null;
    }
  }, [timezone, now]);
}

export function LocalTimeCard({ timezone }: { timezone: string | null }) {
  const clock = useLocalClock(timezone);
  const isDay = clock !== null && clock.hour >= 6 && clock.hour < 18;

  return (
    <SnapshotCard
      icon={isDay ? Sun : Moon}
      title="Local time"
      state={clock ? 'ready' : 'error'}
      errorHint="Unknown zone"
    >
      {clock ? (
        <View className="gap-0.5">
          <Text variant="h3" numberOfLines={1} adjustsFontSizeToFit>
            {clock.time}
          </Text>
          <Text variant="caption" color="muted" numberOfLines={1}>
            {clock.weekday}
          </Text>
        </View>
      ) : null}
    </SnapshotCard>
  );
}
