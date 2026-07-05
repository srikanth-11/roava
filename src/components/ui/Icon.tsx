import type { LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { palette, type PaletteScheme } from '@/lib/palette';

export type IconSize = 16 | 20 | 24 | 32 | 48;

export type IconColor =
  'default' | 'muted' | 'primary' | 'on-primary' | 'on-image' | 'destructive' | 'success';

// Lucide takes color as a prop (SVG stroke), not via className — icons read
// token values from the JS-side palette mirror in lib/palette.
const iconColorKey: Record<IconColor, keyof (typeof palette)['light']> = {
  default: 'foreground',
  muted: 'mutedForeground',
  primary: 'primary',
  'on-primary': 'onPrimary',
  'on-image': 'onImage',
  destructive: 'destructive',
  success: 'success',
};

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  color?: IconColor;
  /** Fill the glyph with its stroke color (e.g. a saved heart). */
  filled?: boolean;
  /** Required when the icon conveys meaning on its own. */
  accessibilityLabel?: string;
}

export function Icon({
  icon: LucideCmp,
  size = 20,
  color = 'default',
  filled = false,
  accessibilityLabel,
}: IconProps) {
  const { colorScheme } = useColorScheme();
  const scheme: PaletteScheme = colorScheme ?? 'light';
  const resolved = palette[scheme][iconColorKey[color]];

  return (
    <LucideCmp
      size={size}
      strokeWidth={1.75}
      color={resolved}
      fill={filled ? resolved : 'none'}
      accessibilityLabel={accessibilityLabel}
      aria-hidden={accessibilityLabel ? undefined : true}
    />
  );
}
