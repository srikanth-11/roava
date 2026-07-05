/**
 * ISO-3166 country → ISO-4217 currency, for the destination currency card.
 * A static map instead of a GeoDB /countries call: zero API budget, works
 * offline, and covers the countries travelers actually hit. Missing entries
 * degrade the card — they never break the screen.
 */

/** Home currency for rate comparisons. Becomes a Setting in Phase 15. */
export const HOME_CURRENCY = 'INR';

export const COUNTRY_CURRENCY: Record<string, string> = {
  AE: 'AED',
  AR: 'ARS',
  AT: 'EUR',
  AU: 'AUD',
  BD: 'BDT',
  BE: 'EUR',
  BG: 'BGN',
  BR: 'BRL',
  CA: 'CAD',
  CH: 'CHF',
  CL: 'CLP',
  CN: 'CNY',
  CO: 'COP',
  CZ: 'CZK',
  DE: 'EUR',
  DK: 'DKK',
  EG: 'EGP',
  ES: 'EUR',
  FI: 'EUR',
  FR: 'EUR',
  GB: 'GBP',
  GR: 'EUR',
  HK: 'HKD',
  HR: 'EUR',
  HU: 'HUF',
  ID: 'IDR',
  IE: 'EUR',
  IL: 'ILS',
  IN: 'INR',
  IS: 'ISK',
  IT: 'EUR',
  JO: 'JOD',
  JP: 'JPY',
  KE: 'KES',
  KH: 'KHR',
  KR: 'KRW',
  LA: 'LAK',
  LK: 'LKR',
  MA: 'MAD',
  MM: 'MMK',
  MX: 'MXN',
  MY: 'MYR',
  NL: 'EUR',
  NO: 'NOK',
  NP: 'NPR',
  NZ: 'NZD',
  PE: 'PEN',
  PH: 'PHP',
  PK: 'PKR',
  PL: 'PLN',
  PT: 'EUR',
  QA: 'QAR',
  RO: 'RON',
  RS: 'RSD',
  RU: 'RUB',
  SA: 'SAR',
  SE: 'SEK',
  SG: 'SGD',
  TH: 'THB',
  TR: 'TRY',
  TW: 'TWD',
  TZ: 'TZS',
  UA: 'UAH',
  US: 'USD',
  VN: 'VND',
  ZA: 'ZAR',
};

export function currencyForCountry(countryCode: string): string | null {
  return COUNTRY_CURRENCY[countryCode.toUpperCase()] ?? null;
}
