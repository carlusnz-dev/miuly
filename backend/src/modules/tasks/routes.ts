import type { Router } from 'express';
import { BaseRoutes } from '../../core/base';
import type { TaskController } from './controller';

// Todas as rotas exigem autenticação; o app monta o router atrás do requireAuth.
export class TaskRoutes extends BaseRoutes<TaskController, Router> {
  register(router: Router): Router {
    router.get('/', this.controller.list);
    router.post('/', this.controller.create);
    router.get('/:id', this.controller.findById);
    router.patch('/:id', this.controller.update);
    router.delete('/:id', this.controller.delete);

    return router;
  }
}
