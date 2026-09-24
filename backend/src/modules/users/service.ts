import { BaseService } from '../../core/base';
import { NotFoundError } from '../../core/error';
import type { User } from './contract';
import type { UserRepository } from './repository';

export class UserService extends BaseService<UserRepository> {
  async findById(id: number): Promise<User> {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    return user;
  }
}
