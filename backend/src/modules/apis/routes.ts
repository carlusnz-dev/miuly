import type { Router } from 'express';
import { BaseRoutes } from '../../core/base';
import type { ApiConnectionController } from './controller';

// Todas as rotas exigem autenticação; o app monta o router atrás do requireAuth.
export class ApiConnectionRoutes extends BaseRoutes<
  ApiConnectionController,
  Router
> {
  register(router: Router): Router {
    router.get('/', this.controller.list);
    router.post('/', this.controller.create);
    router.get('/:id', this.controller.findById);
    router.patch('/:id', this.controller.update);
    router.delete('/:id', this.controller.delete);

    return router;
  }
}
