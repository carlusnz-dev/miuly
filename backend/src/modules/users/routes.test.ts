import type { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { UserController } from './controller';
import { UserRoutes } from './routes';

describe('UserRoutes.register', () => {
  it('registra as rotas de /me', () => {
    const controller = {
      findMe: vi.fn(),
      updateMe: vi.fn(),
      changePassword: vi.fn(),
      findMyProfile: vi.fn(),
      updateMyProfile: vi.fn(),
    };
    const router = { get: vi.fn(), patch: vi.fn(), put: vi.fn() };

    const result = new UserRoutes(
      controller as unknown as UserController,
    ).register(router as unknown as Router);

    expect(router.get.mock.calls).toEqual([
      ['/me', controller.findMe],
      ['/me/profile', controller.findMyProfile],
    ]);
    expect(router.patch.mock.calls).toEqual([
      ['/me', controller.updateMe],
      ['/me/profile', controller.updateMyProfile],
    ]);
    expect(router.put.mock.calls).toEqual([
      ['/me/password', controller.changePassword],
    ]);
    expect(result).toBe(router);
  });
});
