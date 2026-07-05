/**
 * OpenFreeMap hosted style JSONs — keyless, cardless, no signup (verified:
 * liberty/bright/positron/dark/fiord all return 200). The map obeys the app
 * theme like every other surface.
 */
export const MAP_STYLES = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
} as const;

/** Rendering this is the one obligation OSM data carries (like Unsplash credits). */
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';
