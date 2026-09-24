import type { Router } from 'express';
import { BaseRoutes } from '../../core/base';
import type { UserController } from './controller';

// Todas as rotas exigem autenticação; o app monta o router atrás do requireAuth.
export class UserRoutes extends BaseRoutes<UserController, Router> {
  register(router: Router): Router {
    router.get('/me', this.controller.findMe);
    router.patch('/me', this.controller.updateMe);
    router.put('/me/password', this.controller.changePassword);
    router.get('/me/profile', this.controller.findMyProfile);
    router.patch('/me/profile', this.controller.updateMyProfile);

    return router;
  }
}
