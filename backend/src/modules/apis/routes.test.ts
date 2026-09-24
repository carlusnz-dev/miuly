import type { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { ApiConnectionController } from './controller';
import { ApiConnectionRoutes } from './routes';

describe('ApiConnectionRoutes.register', () => {
  it('registra o CRUD', () => {
    const controller = {
      list: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const router = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    new ApiConnectionRoutes(
      controller as unknown as ApiConnectionController,
    ).register(router as unknown as Router);

    expect(router.get.mock.calls).toEqual([
      ['/', controller.list],
      ['/:id', controller.findById],
    ]);
    expect(router.post.mock.calls).toEqual([['/', controller.create]]);
    expect(router.patch.mock.calls).toEqual([['/:id', controller.update]]);
    expect(router.delete.mock.calls).toEqual([['/:id', controller.delete]]);
  });
});
