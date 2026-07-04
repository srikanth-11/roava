export interface Destination {
  id: string;
  name: string;
  country: string;
  /** Short tagline for cards. */
  blurb: string;
  /** Remote image URL (Unsplash in live impl). */
  imageUrl: string | null;
}
