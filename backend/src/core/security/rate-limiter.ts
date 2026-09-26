import { TooManyRequestsError } from '../error';

export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): number | undefined;
  check(key: string): number | undefined;
  incrementFailure(
    key: string,
    limit: number,
    windowMs: number,
  ): number | undefined;
  reset(key: string): void;
  clearExpired(): void;
}

interface Counter {
  count: number;
  expiresAt: number;
  windowMs: number;
  blockedUntil?: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly counters = new Map<string, Counter>();

  constructor(private readonly now: () => number = Date.now) {}

  // Retorna segundos até a liberação quando a chave está bloqueada.
  consume(key: string, limit: number, windowMs: number): number | undefined {
    const now = this.now();
    this.clearExpired();
    const retryAfter = this.check(key);
    if (retryAfter !== undefined) return retryAfter;
    let counter = this.counters.get(key);

    if (!counter || counter.expiresAt <= now || counter.windowMs !== windowMs) {
      counter = { count: 0, expiresAt: now + windowMs, windowMs };
      this.counters.set(key, counter);
    }

    counter.count += 1;
    if (counter.count > limit) {
      counter.blockedUntil = counter.expiresAt;
      return Math.ceil((counter.expiresAt - now) / 1000);
    }

    return undefined;
  }

  check(key: string): number | undefined {
    this.clearExpired();
    const counter = this.counters.get(key);
    if (
      counter?.blockedUntil !== undefined &&
      counter.blockedUntil > this.now()
    ) {
      return Math.ceil((counter.blockedUntil - this.now()) / 1000);
    }
    return undefined;
  }

  incrementFailure(
    key: string,
    limit: number,
    windowMs: number,
  ): number | undefined {
    const now = this.now();
    this.clearExpired();
    let counter = this.counters.get(key);
    if (
      !counter ||
      counter.expiresAt <= now ||
      counter.windowMs !== windowMs ||
      counter.count === 0
    ) {
      counter = { count: 0, expiresAt: now + windowMs, windowMs };
      this.counters.set(key, counter);
    }
    counter.count += 1;
    if (counter.count >= limit) counter.blockedUntil = counter.expiresAt;
    return undefined;
  }

  reset(key: string): void {
    this.counters.delete(key);
  }

  clearExpired(): void {
    const now = this.now();
    for (const [key, counter] of this.counters) {
      if (counter.expiresAt <= now) this.counters.delete(key);
    }
  }

  get size(): number {
    this.clearExpired();
    return this.counters.size;
  }
}

export function enforceRateLimit(
  limiter: RateLimiter,
  key: string,
  limit: number,
  windowMs: number,
): void {
  const retryAfter = limiter.consume(key, limit, windowMs);
  if (retryAfter !== undefined) throw new TooManyRequestsError(retryAfter);
}
