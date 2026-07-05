/**
 * JS-side mirror of the CSS-variable tokens in global.css — for the few places
 * styles can't reach: SVG icon props, navigator container backgrounds, status
 * bars. If a value changes in global.css it MUST change here too (single
 * exception to the "tokens live in one file" rule, documented in the plan).
 */
export const palette = {
  light: {
    primary: 'rgb(234 88 12)',
    onPrimary: 'rgb(255 255 255)',
    secondary: 'rgb(8 145 178)',
    background: 'rgb(255 247 237)',
    surface: 'rgb(255 255 255)',
    foreground: 'rgb(15 23 42)',
    mutedForeground: 'rgb(100 116 139)',
    border: 'rgb(252 234 225)',
    destructive: 'rgb(220 38 38)',
    success: 'rgb(22 163 74)',
    onImage: 'rgb(255 255 255)',
  },
  dark: {
    primary: 'rgb(251 146 60)',
    onPrimary: 'rgb(28 16 5)',
    secondary: 'rgb(34 211 238)',
    background: 'rgb(11 17 32)',
    surface: 'rgb(30 41 59)',
    foreground: 'rgb(241 245 249)',
    mutedForeground: 'rgb(148 163 184)',
    border: 'rgb(51 65 85)',
    destructive: 'rgb(248 113 113)',
    success: 'rgb(74 222 128)',
    onImage: 'rgb(255 255 255)',
  },
} as const;

export type PaletteScheme = keyof typeof palette;
