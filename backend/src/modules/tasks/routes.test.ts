import type { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { TaskController } from './controller';
import { TaskRoutes } from './routes';

describe('TaskRoutes.register', () => {
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

    new TaskRoutes(controller as unknown as TaskController).register(
      router as unknown as Router,
    );

    expect(router.get.mock.calls).toEqual([
      ['/', controller.list],
      ['/:id', controller.findById],
    ]);
    expect(router.post.mock.calls).toEqual([['/', controller.create]]);
    expect(router.patch.mock.calls).toEqual([['/:id', controller.update]]);
    expect(router.delete.mock.calls).toEqual([['/:id', controller.delete]]);
  });
});
