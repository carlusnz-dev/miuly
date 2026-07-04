import bcrypt from 'bcrypt';
import {
  createUser,
  findUserByEmailOrUsername,
} from '../repositories/user.repository.js';
import type { UserModel } from '../generated/prisma/models.js';
import type { ServiceResult } from '../types/result.type.js';

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
      const newUser = await createUser({ ...data, password: hashedPassword });
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
