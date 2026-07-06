import Logger from '../lib/logger.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmailOrUsername } from '../repositories/user.repository.js';
import type { LoginServiceResult } from '../types/result.type.js';
import type { LoginUserInput } from '../types/user.type.js';

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
