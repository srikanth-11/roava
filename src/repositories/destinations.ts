import { mockDestinations } from '@/mocks/destinations';
import { toAppError } from '@/services/errors';
import type { Destination } from '@/types/destination';

/**
 * Data-access contract for destinations. Screens and RTK Query know ONLY this
 * interface — the live GeoDB/Unsplash implementation replaces the mock in
 * Phase 5 without touching a single screen.
 */
export interface DestinationsRepository {
  getTrending(): Promise<Destination[]>;
}

interface MockBehavior {
  latencyMs: number;
  /** Next call fails with this kind of failure (one-shot). */
  failNext: 'none' | 'network' | 'server' | 'empty';
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MockDestinationsRepository implements DestinationsRepository {
  private behavior: MockBehavior = { latencyMs: 900, failNext: 'none' };

  /** Dev-only control surface so the demo screen can reproduce every state. */
  setNextBehavior(fail: MockBehavior['failNext'], latencyMs = 900): void {
    this.behavior = { latencyMs, failNext: fail };
  }

  async getTrending(): Promise<Destination[]> {
    await sleep(this.behavior.latencyMs);
    const { failNext } = this.behavior;
    this.behavior = { ...this.behavior, failNext: 'none' };

    if (failNext === 'network') {
      throw toAppError({ isAxiosError: true, message: 'Network Error', code: 'ERR_NETWORK' });
    }
    if (failNext === 'server') {
      throw toAppError({
        isAxiosError: true,
        message: 'Internal Server Error',
        response: { status: 500 },
      });
    }
    if (failNext === 'empty') {
      return [];
    }
    return mockDestinations;
  }
}

/** Swap point: Phase 5 replaces this with the live implementation. */
export const destinationsRepository: DestinationsRepository = new MockDestinationsRepository();
