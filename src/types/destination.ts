export interface Destination {
  id: string;
  name: string;
  country: string;
  /** Short tagline for cards. */
  blurb: string;
  /** Remote image URL (Unsplash in live impl). */
  imageUrl: string | null;
  /** Unsplash attribution — rendering it is an API-terms requirement. */
  photoCredit: string | null;
  population: number | null;
}

/** Everything the detail screen needs — coords power weather/POIs, timezone powers local time. */
export interface DestinationDetail {
  id: string;
  name: string;
  country: string;
  /** ISO-3166 alpha-2 — key into the currency map. */
  countryCode: string;
  region: string | null;
  latitude: number;
  longitude: number;
  population: number | null;
  /** IANA zone ("Europe/Paris") — GeoDB's "__" separator already normalized. */
  timezone: string | null;
  imageUrl: string | null;
  photoCredit: string | null;
}
