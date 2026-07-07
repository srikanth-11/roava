/**
 * Canonical share links. Destinations share as clean https URLs on the
 * EAS-Hosted domain: Android App Links open the app on that destination when
 * installed (app.json intentFilters + /.well-known/assetlinks.json served
 * here), and the web build renders a page otherwise. No more raw `roava://`
 * scheme leaking into share sheets.
 */
export const WEB_BASE = 'https://roava.expo.app';

export function destinationShareUrl(id: string): string {
  return `${WEB_BASE}/destination/${id}`;
}
