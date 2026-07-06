import { useColorScheme } from 'nativewind';
import Svg, { Circle, G, Line, Path, Polygon } from 'react-native-svg';

import { palette } from '@/lib/palette';

/**
 * The Roava mark — "R + compass": the R's leg is the needle. SAME geometry as
 * the launcher icon and splash (scripts/generate-brand-assets.mjs renders the
 * PNG variants from it — change both together). Theme-aware: ink follows the
 * foreground token, the needle and ring stay brand orange.
 */
export function AppLogo({ size = 96 }: { size?: number }) {
  const { colorScheme } = useColorScheme();
  const colors = palette[colorScheme ?? 'light'];
  const ink = colors.foreground;
  const accent = colors.primary;

  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityLabel="Roava">
      <Circle cx={512} cy={512} r={396} fill="none" stroke={accent} strokeWidth={58} />
      <G stroke={ink} strokeWidth={30} strokeLinecap="round">
        <Line x1={512} y1={190} x2={512} y2={248} />
        <Line x1={512} y1={776} x2={512} y2={834} />
        <Line x1={190} y1={512} x2={248} y2={512} />
        <Line x1={776} y1={512} x2={834} y2={512} />
      </G>
      <G fill="none" stroke={ink} strokeWidth={88} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M 400 340 L 400 690" />
        <Path d="M 400 340 L 540 340 A 100 100 0 0 1 540 540 L 400 540" />
      </G>
      <Polygon points="558,534 672,610 756,760 606,676 530,562" fill={accent} />
    </Svg>
  );
}
