import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

import { toAppError } from '@/services/errors';

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 400;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * One instance per external API (per-API baseURL, headers, quirks).
 * Every instance shares: timeout, dev logging, AppError mapping.
 */
export function createHttpClient(config: AxiosRequestConfig): AxiosInstance {
  const client = axios.create({
    timeout: DEFAULT_TIMEOUT_MS,
    ...config,
  });

  if (__DEV__) {
    client.interceptors.request.use((req) => {
      console.log(`→ ${req.method?.toUpperCase()} ${req.baseURL ?? ''}${req.url}`);
      return req;
    });
    client.interceptors.response.use(
      (res) => {
        console.log(`← ${res.status} ${res.config.url}`);
        return res;
      },
      (err) => {
        console.log(`✖ ${err?.response?.status ?? err?.code} ${err?.config?.url}`);
        return Promise.reject(err);
      },
    );
  }

  return client;
}

/**
 * GET with exponential backoff. Only GETs retry — they're idempotent; retrying
 * a failed POST could duplicate a side effect. Retries only retryable kinds
 * (never 4xx — same request would fail the same way).
 */
export async function getWithRetry<T>(
  client: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await client.get<T>(url, config);
      return res.data;
    } catch (error) {
      lastError = error;
      const appError = toAppError(error);
      const isLastAttempt = attempt === MAX_RETRIES;
      if (!appError.retryable || isLastAttempt) throw appError;
      await sleep(BASE_BACKOFF_MS * 2 ** attempt); // 400ms, 800ms
    }
  }

  throw toAppError(lastError);
}
