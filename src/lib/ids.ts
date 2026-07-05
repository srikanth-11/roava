/**
 * Local-only id generator — timestamp base36 + random suffix. Collision-safe
 * for single-device data (the only kind Roava stores); swaps for real UUIDs
 * the day a sync backend exists. Pure JS on purpose: crypto-backed UUIDs
 * would drag a native module into the build for no local benefit.
 */
let counter = 0;

export function newId(): string {
  counter = (counter + 1) % 1296; // two base36 digits of in-tick uniqueness
  return (
    Date.now().toString(36) +
    counter.toString(36).padStart(2, '0') +
    Math.random().toString(36).slice(2, 8)
  );
}
