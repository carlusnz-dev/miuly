import { describe, expect, it, vi } from 'vitest';
import { InMemoryRateLimiter } from '../../core/security/rate-limiter';
import {
  asResponse,
  fakeNext,
  fakeRequest,
  fakeResponse,
} from '../../test/http';
import { AuthRoutes } from './routes';
import type { AuthController } from './controller';

function setup() {
  const limiter = new InMemoryRateLimiter(() => 0);
  const handlers: Record<string, Array<(...args: any[]) => unknown>> = {};
  const router = {
    post: vi.fn(
      (path: string, ...callbacks: Array<(...args: any[]) => unknown>) => {
        handlers[path] = callbacks;
        return router;
      },
    ),
    get: vi.fn(() => router),
  };
  const controller = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  } as unknown as AuthController;
  new AuthRoutes(controller, vi.fn(), limiter).register(router as never);
  return { handlers };
}

describe('AuthRoutes rate limits', () => {
  it('bloqueia a 21ª tentativa do mesmo IP e informa Retry-After', () => {
    const { handlers } = setup();
    const middleware = handlers['/login']?.[0];
    const res = fakeResponse();
    const req = fakeRequest({ ip: '192.0.2.10' });

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const next = fakeNext();
      middleware?.(req, asResponse(res), next);
      expect(next).toHaveBeenCalledWith();
    }
    const next = fakeNext();
    middleware?.(req, asResponse(res), next);
    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 429 });
    expect(res.headers['Retry-After']).toBe('900');
  });

  it('mantém limites isolados entre IPs', () => {
    const { handlers } = setup();
    const middleware = handlers['/login']?.[0];
    const res = fakeResponse();
    const firstIp = fakeRequest({ ip: '192.0.2.10' });
    const secondIp = fakeRequest({ ip: '192.0.2.11' });

    for (let attempt = 0; attempt < 20; attempt += 1) {
      middleware?.(firstIp, asResponse(res), fakeNext());
    }
    const blocked = fakeNext();
    middleware?.(firstIp, asResponse(res), blocked);
    expect(blocked.mock.calls[0]?.[0]).toMatchObject({ statusCode: 429 });

    const allowed = fakeNext();
    middleware?.(secondIp, asResponse(res), allowed);
    expect(allowed).toHaveBeenCalledWith();
  });

  it('bloqueia o cadastro na 6ª tentativa do IP', () => {
    const { handlers } = setup();
    const middleware = handlers['/register']?.[0];
    const req = fakeRequest({ ip: '192.0.2.10' });
    const res = fakeResponse();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const next = fakeNext();
      middleware?.(req, asResponse(res), next);
      expect(next).toHaveBeenCalledWith();
    }
    const next = fakeNext();
    middleware?.(req, asResponse(res), next);
    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 429 });
    expect(res.headers['Retry-After']).toBe('3600');
  });
});
