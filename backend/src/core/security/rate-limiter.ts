import { TooManyRequestsError } from '../error';

export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): number | undefined;
  check(key: string): number | undefined;
  reset(key: string): void;
}

interface Counter {
  count: number;
  expiresAt: number;
  windowMs: number;
  blockedUntil?: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly counters = new Map<string, Counter>();
  private lastCleanupAt = Number.NEGATIVE_INFINITY;

  static readonly CLEANUP_INTERVAL_MS = 60_000;
  static readonly MAX_KEYS = 50_000;

  constructor(private readonly now: () => number = Date.now) {}

  // Retorna segundos até a liberação quando a chave está bloqueada.
  consume(key: string, limit: number, windowMs: number): number | undefined {
    const now = this.now();
    this.cleanupIfDue(now);
    const retryAfter = this.blockedFor(key, now);
    if (retryAfter !== undefined) return retryAfter;
    let counter = this.counters.get(key);

    if (!counter || counter.expiresAt <= now || counter.windowMs !== windowMs) {
      this.makeRoom(now);
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
    const now = this.now();
    this.cleanupIfDue(now);
    return this.blockedFor(key, now);
  }

  private blockedFor(key: string, now: number): number | undefined {
    const counter = this.counters.get(key);
    if (counter?.blockedUntil !== undefined && counter.blockedUntil > now) {
      return Math.ceil((counter.blockedUntil - now) / 1000);
    }
    return undefined;
  }

  reset(key: string): void {
    this.counters.delete(key);
  }

  clearExpired(): void {
    this.removeExpired(this.now());
  }

  private cleanupIfDue(now: number): void {
    if (now - this.lastCleanupAt < InMemoryRateLimiter.CLEANUP_INTERVAL_MS)
      return;
    this.removeExpired(now);
    this.lastCleanupAt = now;
  }

  private removeExpired(now: number): void {
    for (const [key, counter] of this.counters) {
      if (counter.expiresAt <= now) this.counters.delete(key);
    }
  }

  private makeRoom(now: number): void {
    if (this.counters.size < InMemoryRateLimiter.MAX_KEYS) return;
    this.removeExpired(now);
    while (this.counters.size >= InMemoryRateLimiter.MAX_KEYS) {
      const oldestKey = this.counters.keys().next().value as string | undefined;
      if (oldestKey === undefined) break;
      this.counters.delete(oldestKey);
    }
  }

  get size(): number {
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
