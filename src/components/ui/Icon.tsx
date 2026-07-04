import type { LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export type IconSize = 16 | 20 | 24;

export type IconColor = 'default' | 'muted' | 'primary' | 'on-primary' | 'destructive' | 'success';

// Lucide takes color as a prop (SVG stroke), not via className — so icons read
// the token values from this theme-aware map. Single source: global.css.
const iconPalette: Record<'light' | 'dark', Record<IconColor, string>> = {
  light: {
    default: 'rgb(15 23 42)',
    muted: 'rgb(100 116 139)',
    primary: 'rgb(234 88 12)',
    'on-primary': 'rgb(255 255 255)',
    destructive: 'rgb(220 38 38)',
    success: 'rgb(22 163 74)',
  },
  dark: {
    default: 'rgb(241 245 249)',
    muted: 'rgb(148 163 184)',
    primary: 'rgb(251 146 60)',
    'on-primary': 'rgb(28 16 5)',
    destructive: 'rgb(248 113 113)',
    success: 'rgb(74 222 128)',
  },
};

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  color?: IconColor;
  /** Required when the icon conveys meaning on its own. */
  accessibilityLabel?: string;
}

export function Icon({
  icon: LucideCmp,
  size = 20,
  color = 'default',
  accessibilityLabel,
}: IconProps) {
  const { colorScheme } = useColorScheme();
  const palette = iconPalette[colorScheme ?? 'light'];

  return (
    <LucideCmp
      size={size}
      strokeWidth={1.75}
      color={palette[color]}
      accessibilityLabel={accessibilityLabel}
      aria-hidden={accessibilityLabel ? undefined : true}
    />
  );
}
