import type { RequestHandler, Router } from 'express';
import { BaseRoutes } from '../../core/base';
import type { AuthController } from './controller';

export class AuthRoutes extends BaseRoutes<AuthController, Router> {
  constructor(
    controller: AuthController,
    private readonly requireAuth: RequestHandler,
  ) {
    super(controller);
  }

  register(router: Router): Router {
    router.post('/register', this.controller.register);
    router.post('/login', this.controller.login);
    router.post('/refresh', this.controller.refresh);
    router.post('/logout', this.controller.logout);
    router.get('/me', this.requireAuth, this.controller.me);

    return router;
  }
}
