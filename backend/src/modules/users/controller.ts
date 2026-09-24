import { BaseController } from '../../core/base';
import { handler } from '../../core/http/handler';
import { toUserResponse, userIdParamsSchema } from './contract';
import type { UserService } from './service';

export class UserController extends BaseController<UserService> {
  findById = handler({
    schemas: { params: userIdParamsSchema },
    message: 'Usuário encontrado',
    execute: ({ params }) => this.service.findById(params.id),
    present: toUserResponse,
  });
}
