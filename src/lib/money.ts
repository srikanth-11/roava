/** Shared money rendering — Hermes ships full ICU, so this is free and correct. */
export function formatMoney(value: number, code: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);
  } catch {
    // Unknown ISO code for ICU — plain number beats a crash.
    return `${value.toFixed(2)} ${code}`;
  }
}
