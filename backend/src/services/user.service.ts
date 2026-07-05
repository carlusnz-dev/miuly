import bcrypt from 'bcrypt';
import {
  createUser,
  deleteUser,
  findAllUsers,
  findUserByEmailOrUsername,
  findUserById,
  updateUser,
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

export async function updateUserService(
  data: UserModel,
  userId: number,
): Promise<ServiceResult<Omit<UserModel, 'password'>>> {
  const findedUser = await findUserById(userId);

  if (!findedUser) {
    Logger.error(`Usuário ${userId} não foi encontrado.`);
    return {
      ok: false,
      reason: 'not_found',
      message: `Usuário ID ${userId} não foi encontrado`,
    };
  }

  if (findedUser) {
    Logger.info(`Usuário encontrado: ${findedUser.id}`);
    const findedEmail = await findUserByEmailOrUsername(data);
    if (findedEmail) {
      Logger.error(`E-mail já existe no banco. ${findedEmail.email}`);

      return {
        ok: false,
        reason: 'conflict',
        message: `E-mail ${findedEmail.email} já existe no sistema.`,
      };
    }

    try {
      const updatedUser = await updateUser(
        {
          username: data.username,
          email: data.email,
        },
        userId,
      );

      Logger.info(`Usuário ${data.id} atualizado com sucesso!`);
      return {
        ok: true,
        data: updatedUser,
      };
    } catch (e) {
      Logger.error(`Erro ao atualizar o usuário ${userId}: ${e}`);
    }
  }

  return {
    ok: false,
    reason: 'error',
    message: 'Dados inválidos para atualização do usuário.',
  };
}

export async function deleteUserService(
  userId: number,
): Promise<ServiceResult<Omit<UserModel, 'password'>>> {
  const findedUser = await findUserById(userId);

  if (!findedUser) {
    Logger.error(`Usuário ID ${userId} não encontrado.`);
    return {
      ok: false,
      reason: 'not_found',
      message: `Usuário ID ${userId} não encontrado.`,
    };
  }

  if (findedUser) {
    Logger.info(`Usuário ID ${userId} encontrado com sucesso!`);

    try {
      const deletedUser = await deleteUser(userId);

      return {
        ok: true,
        data: deletedUser,
      };
    } catch (e) {
      Logger.error(`Erro ao deletar o usuário ${userId}: ${e}`);
      return {
        ok: false,
        reason: 'error',
        message: 'Erro ao deletar o usuário.',
      };
    }
  }

  return {
    ok: false,
    reason: 'error',
    message: 'Dados inválidos para excluir o usuário.',
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
      Logger.warn(`Usuário ${userId} não existe.`);
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
