import { createHttpClient, getWithRetry } from '@/services/http';

/**
 * open.er-api.com — keyless, rates refresh daily. Callers cache aggressively;
 * a currency snapshot doesn't need minute-level freshness.
 */

interface ErApiResponse {
  result: 'success' | 'error';
  base_code: string;
  rates: Record<string, number>;
  time_last_update_unix: number;
}

const client = createHttpClient({
  baseURL: 'https://open.er-api.com/v6',
});

export async function fetchRates(base: string): Promise<ErApiResponse> {
  const res = await getWithRetry<ErApiResponse>(client, `/latest/${base}`);
  // er-api reports failures as 200 + result:"error" — normalize to a throw.
  if (res.result !== 'success') {
    throw new Error(`er-api returned result=${res.result} for base ${base}`);
  }
  return res;
}
