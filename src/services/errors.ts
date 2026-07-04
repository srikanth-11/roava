import { isAxiosError } from 'axios';

export type AppErrorKind =
  | 'network' // no connectivity / DNS / socket
  | 'timeout' // request exceeded its deadline
  | 'rate-limit' // 429 — free-tier APIs hit this often
  | 'server' // 5xx — their fault
  | 'client' // 4xx (except 429) — our fault
  | 'unknown';

export interface AppError {
  kind: AppErrorKind;
  /** Safe to render to the user. */
  userMessage: string;
  /** For logs/Sentry — never rendered. */
  debugMessage: string;
  status?: number;
  /** UI may offer retry only when this is true. */
  retryable: boolean;
}

const USER_MESSAGES: Record<AppErrorKind, string> = {
  network: "You're offline. Check your connection and try again.",
  timeout: 'This is taking too long. Please try again.',
  'rate-limit': "We're fetching too fast. Give it a few seconds.",
  server: 'The service is having trouble. Try again shortly.',
  client: "Something's wrong with this request.",
  unknown: 'Something went wrong. Please try again.',
};

function make(kind: AppErrorKind, debugMessage: string, status?: number): AppError {
  return {
    kind,
    userMessage: USER_MESSAGES[kind],
    debugMessage,
    status,
    retryable:
      kind === 'network' || kind === 'timeout' || kind === 'rate-limit' || kind === 'server',
  };
}

/** Single funnel: anything thrown anywhere in the data layer becomes an AppError. */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return make('timeout', error.message);
    }
    if (!error.response) {
      return make('network', error.message);
    }
    const status = error.response.status;
    if (status === 429) return make('rate-limit', error.message, status);
    if (status >= 500) return make('server', error.message, status);
    return make('client', error.message, status);
  }

  if (error instanceof Error) return make('unknown', error.message);
  return make('unknown', String(error));
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    'userMessage' in error &&
    'retryable' in error
  );
}
