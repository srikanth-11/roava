import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';

import type { WeatherKind } from '@/repositories/weather';

/** One icon vocabulary for every weather surface (Phase 7 card + Phase 8 screen). */
export const kindIcon: Record<WeatherKind, LucideIcon> = {
  thunder: CloudLightning,
  rain: CloudRain,
  snow: CloudSnow,
  mist: CloudFog,
  clear: Sun,
  clouds: Cloud,
};
