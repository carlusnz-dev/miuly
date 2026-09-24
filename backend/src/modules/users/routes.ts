import type { Router } from 'express';
import { BaseRoutes } from '../../core/base';
import type { UserController } from './controller';

export class UserRoutes extends BaseRoutes<UserController, Router> {
  register(router: Router): Router {
    router.get('/:id', this.controller.findById);

    return router;
  }
}
