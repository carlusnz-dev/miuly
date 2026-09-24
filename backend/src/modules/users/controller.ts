import { BaseController } from '../../core/base';
import { handler } from '../../core/http/handler';
import {
  changePasswordBodySchema,
  toProfileResponse,
  toUserResponse,
  updateProfileBodySchema,
  updateUserBodySchema,
} from './contract';
import type { UserService } from './service';

export class UserController extends BaseController<UserService> {
  findMe = handler({
    auth: true,
    message: 'Usuário encontrado',
    execute: ({ auth }) => this.service.findMe(auth.userId),
    present: toUserResponse,
  });

  updateMe = handler({
    auth: true,
    schemas: { body: updateUserBodySchema },
    message: 'Usuário atualizado',
    execute: ({ auth, body }) => this.service.updateMe(auth.userId, body),
    present: toUserResponse,
  });

  changePassword = handler({
    auth: true,
    schemas: { body: changePasswordBodySchema },
    message: 'Senha alterada; entre novamente',
    execute: ({ auth, body }) => this.service.changePassword(auth.userId, body),
    present: () => null,
  });

  findMyProfile = handler({
    auth: true,
    message: 'Perfil encontrado',
    execute: ({ auth }) => this.service.findMyProfile(auth.userId),
    present: toProfileResponse,
  });

  updateMyProfile = handler({
    auth: true,
    schemas: { body: updateProfileBodySchema },
    message: 'Perfil atualizado',
    execute: ({ auth, body }) =>
      this.service.updateMyProfile(auth.userId, body),
    present: toProfileResponse,
  });
}
