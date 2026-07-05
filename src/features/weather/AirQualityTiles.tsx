import { Leaf, Sun } from 'lucide-react-native';
import { View } from 'react-native';

import { SnapshotCard } from '@/components/shared/SnapshotCard';
import { Text, type TextColor } from '@/components/ui';
import type { AirQuality } from '@/repositories/weather';

/** OpenWeather's 1–5 scale, mapped to honest words and semantic colors. */
const AQI_META: Record<number, { label: string; color: TextColor }> = {
  1: { label: 'Good', color: 'success' },
  2: { label: 'Fair', color: 'success' },
  3: { label: 'Moderate', color: 'default' },
  4: { label: 'Poor', color: 'destructive' },
  5: { label: 'Very poor', color: 'destructive' },
};

export function AqiTile({ aqi }: { aqi: AirQuality | null }) {
  const meta = aqi ? AQI_META[aqi.aqi] : undefined;
  return (
    <SnapshotCard
      icon={Leaf}
      title="Air quality"
      state={aqi && meta ? 'ready' : 'error'}
      errorHint="Unavailable"
    >
      {aqi && meta ? (
        <View className="gap-0.5">
          <Text variant="h3" color={meta.color}>
            {meta.label}
          </Text>
          <Text variant="caption" color="muted" numberOfLines={1}>
            PM2.5 {aqi.pm2_5.toFixed(1)} · O₃ {Math.round(aqi.o3)}
          </Text>
        </View>
      ) : null}
    </SnapshotCard>
  );
}

function uvMeta(uv: number): { label: string; color: TextColor } {
  if (uv < 3) return { label: 'Low', color: 'success' };
  if (uv < 6) return { label: 'Moderate', color: 'default' };
  if (uv < 8) return { label: 'High', color: 'destructive' };
  return { label: 'Very high', color: 'destructive' };
}

export function UvTile({ uvMax }: { uvMax: number | null }) {
  const meta = uvMax !== null ? uvMeta(uvMax) : null;
  return (
    <SnapshotCard
      icon={Sun}
      title="UV index"
      state={meta ? 'ready' : 'error'}
      errorHint="Unavailable"
    >
      {meta && uvMax !== null ? (
        <View className="gap-0.5">
          <Text variant="h3" color={meta.color}>
            {uvMax.toFixed(1)}
          </Text>
          <Text variant="caption" color="muted">
            {meta.label} · today&apos;s max
          </Text>
        </View>
      ) : null}
    </SnapshotCard>
  );
}
