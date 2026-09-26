import { describe, expect, it } from 'vitest';
import { TooManyRequestsError } from '../error';
import { InMemoryRateLimiter } from './rate-limiter';

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

  it('isola chaves e limita a limpeza global a uma vez por intervalo', () => {
    let now = 0;
    const limiter = new InMemoryRateLimiter(() => now);
    limiter.consume('email:a', 1, 1000);
    limiter.consume('email:b', 1, 1000);
    limiter.consume('ip:a', 1, 1000);

    expect(limiter.size).toBe(3);
    now = 1000;
    // A varredura não ocorre antes dos 60 segundos, mesmo com várias chamadas.
    expect(limiter.consume('email:c', 1, 1000)).toBeUndefined();
    expect(limiter.size).toBe(4);
    now = 60_000;
    expect(limiter.check('email:a')).toBeUndefined();
    expect(limiter.size).toBe(0);
    limiter.consume('email:d', 1, 100_000);
    expect(limiter.consume('email:d', 1, 100_000)).toBe(100);
    expect(limiter.size).toBe(1);
  });

  it('limita as chaves e descarta as mais antigas após limpar expiradas', () => {
    let now = 0;
    const limiter = new InMemoryRateLimiter(() => now);
    const originalMax = InMemoryRateLimiter.MAX_KEYS;
    Object.defineProperty(InMemoryRateLimiter, 'MAX_KEYS', { value: 3 });
    try {
      limiter.consume('oldest', 10, 100_000);
      limiter.consume('middle', 10, 100_000);
      limiter.consume('newest', 10, 100_000);
      limiter.consume('fourth', 10, 100_000);

      expect(limiter.size).toBe(3);
      expect(limiter.check('oldest')).toBeUndefined();
      expect(limiter.consume('oldest', 10, 100_000)).toBeUndefined();
      expect(limiter.size).toBe(3);
    } finally {
      Object.defineProperty(InMemoryRateLimiter, 'MAX_KEYS', {
        value: originalMax,
      });
    }
  });
});
