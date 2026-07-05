import bcrypt from 'bcrypt';
import {
  createUser,
  findAllUsers,
  findUserByEmailOrUsername,
  findUserById,
} from '../repositories/user.repository.js';
import type { UserModel } from '../generated/prisma/models.js';
import type { ServiceResult } from '../types/result.type.js';
import Logger from '../lib/logger.js';

export async function createUserService(
  data: UserModel,
): Promise<ServiceResult<Omit<UserModel, 'password'>>> {
  if (data) {
    // Verificar email e username
    const existingUser = await findUserByEmailOrUsername(data);
    if (existingUser) {
      console.log('E-mail ou nome de usuário já existente.');
      return {
        ok: false,
        reason: 'conflict',
        message: 'E-mail ou nome de usuário já estão em uso.',
      };
    }

    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    console.log('Senha com hash feita.');

    // criar novo user
    try {
      const newUser = await createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
      });
      return {
        ok: true,
        data: newUser,
      };
    } catch (e) {
      return {
        ok: false,
        reason: 'error',
        message: `Erro ao criar novo usuário: ${e}`,
      };
    }
  }

  console.log('Erro ao carregar data para criar novo usuário.');
  return {
    ok: false,
    reason: 'error',
    message: 'Dados inválidos para criar um usuário',
  };
}

export async function findAllUsersService(): Promise<
  ServiceResult<Omit<UserModel, 'password'>[]>
> {
  const allUsers = await findAllUsers();
  Logger.debug('A busca no banco está sendo feita (allUsers).');

  if (allUsers) {
    Logger.debug('Objeto allUsers não está vazio.');
    return {
      ok: true,
      data: allUsers,
    };
  }

  return {
    ok: false,
    reason: 'error',
    message: 'Dados inválidos para buscar os usuários.',
  };
}

export async function findUserByIdService(
  userId: number,
): Promise<ServiceResult<Omit<UserModel, 'password'>>> {
  if (userId) {
    const findedUser = await findUserById(userId);

    if (findedUser) {
      Logger.info('Usuário foi encontrado com sucesso!');
      return {
        ok: true,
        data: findedUser,
      };
    } else {
      return {
        ok: false,
        reason: 'not_found',
        message: 'Usuário não existe.',
      };
    }
  }

  return {
    ok: false,
    reason: 'error',
    message: 'Dados inválidos para buscar o usuário',
  };
}
