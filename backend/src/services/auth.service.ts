import Logger from '../lib/logger.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  findUserByEmailOrUsername,
  findUserById,
} from '../repositories/user.repository.js';
import type {
  LoginServiceResult,
  ServiceResult,
} from '../types/result.type.js';
import type { LoginUserInput } from '../types/user.type.js';
import type { UserModel } from '../generated/prisma/models.js';

export async function loginService(
  data: LoginUserInput,
): Promise<LoginServiceResult<string, string>> {
  const foundUser = await findUserByEmailOrUsername({
    ...(data.username && { username: data.username }),
    ...(data.email && { email: data.email }),
  });

  if (!foundUser) {
    Logger.warn(
      `Login falhou (usuário inexistente): ${data.email ?? data.username}`,
    );
    return {
      ok: false,
      reason: 'unauthorized',
      message: 'E-mail ou senha estão errados.',
    };
  }

  Logger.info(`Usuário encontrado com sucesso, ID ${foundUser.id}`);

  if (!(await bcrypt.compare(data.password, foundUser.password))) {
    Logger.warn('A senha da requisição está errada.');
    return {
      ok: false,
      reason: 'unauthorized',
      message: 'E-mail ou senha estão errados.',
    };
  }

  const token = jwt.sign(
    { id: foundUser.id },
    process.env.JWT_SECRET as string,
    {
      expiresIn: '24h',
    },
  );

  Logger.info(`Usuário ID ${foundUser.id} feito login com sucesso!`);
  return {
    ok: true,
    message: `Log-in feito com sucesso!`,
    data: token,
  };
}

// Função para que o usuário logado
// obtenha as suas informações
export async function findLoggedUserByIdService(
  userId: number,
): Promise<ServiceResult<Omit<UserModel, 'password'>>> {
  try {
    // verifica se req.userId contém número
    // mesmo que o req.userId seja do tipo number
    if (typeof userId != 'number') {
      Logger.error(`Tipo inválido recebido no parâmetro.`);
      return {
        ok: false,
        reason: 'error',
        message: 'Forneça um número na requição.',
      };
    }

    // procura pelo usuário
    const foundUser = await findUserById(userId);
    if (!foundUser) {
      Logger.error(`Usuário ${userId} não foi encontrado.`);
      return {
        ok: false,
        reason: 'not_found',
        message: 'Usuário não encontrado no sistema.',
      };
    }

    return {
      ok: true,
      data: foundUser,
    };
  } catch (e) {
    Logger.error(`Erro ao procurar pelo usuário: ${e}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao procurar o usuário.',
    };
  }
}
