import type { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { UserController } from './controller';
import { UserRoutes } from './routes';

describe('UserRoutes.register', () => {
  it('registra GET /:id no handler findById', () => {
    const findById = vi.fn();
    const router = { get: vi.fn() };

    const result = new UserRoutes({
      findById,
    } as unknown as UserController).register(router as unknown as Router);

    expect(router.get).toHaveBeenCalledExactlyOnceWith('/:id', findById);
    expect(result).toBe(router);
  });
});
