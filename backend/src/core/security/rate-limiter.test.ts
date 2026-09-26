import { describe, expect, it } from 'vitest';
import { TooManyRequestsError } from '../error';
import { enforceRateLimit, InMemoryRateLimiter } from './rate-limiter';

describe('InMemoryRateLimiter', () => {
  it('bloqueia acima do limite, informa Retry-After e libera após a janela', () => {
    let now = 10_000;
    const limiter = new InMemoryRateLimiter(() => now);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      expect(limiter.consume('ip:a', 20, 15 * 60 * 1000)).toBeUndefined();
    }
    expect(limiter.consume('ip:a', 20, 15 * 60 * 1000)).toBe(900);
    now += 15 * 60 * 1000;
    expect(limiter.consume('ip:a', 20, 15 * 60 * 1000)).toBeUndefined();
  });

  it('isola chaves e remove contadores expirados', () => {
    let now = 0;
    const limiter = new InMemoryRateLimiter(() => now);
    limiter.consume('email:a', 1, 1000);
    limiter.consume('email:b', 1, 1000);
    limiter.consume('ip:a', 1, 1000);

    expect(limiter.size).toBe(3);
    expect(limiter.consume('email:c', 1, 1000)).toBeUndefined();
    now = 1000;
    limiter.clearExpired();
    expect(limiter.size).toBe(0);
  });

  it('converte bloqueios em TooManyRequestsError', () => {
    const limiter = new InMemoryRateLimiter(() => 0);
    limiter.consume('key', 1, 2000);
    limiter.consume('key', 1, 2000);
    expect(() => enforceRateLimit(limiter, 'key', 1, 2000)).toThrow(
      new TooManyRequestsError(2),
    );
  });
});
