import type { TypesModel } from '../generated/prisma/models.js';
import Logger from '../lib/logger.js';
import { createType, findTypeById } from '../repositories/types.repository.js';
import { findUserById } from '../repositories/user.repository.js';
import type { ServiceResult } from '../types/result.type.js';
import type { CreateTypeInput } from '../types/types.type.js';

export async function createTypeService(
  data: CreateTypeInput,
  userId: number,
): Promise<
  ServiceResult<Pick<TypesModel, 'id' | 'name' | 'applies_to' | 'created_at'>>
> {
  const foundUser = await findUserById(userId);
  if (!foundUser) {
    Logger.error('Erro ao criar o tipo, usuário não existe.');
    return {
      ok: false,
      reason: 'not_found',
      message: 'Usuário não existe.',
    };
  }

  if (data) {
    try {
      const newType = await createType(data, userId);
      const { id, name, applies_to, created_at } = newType;

      Logger.info(`Tipo ID ${newType.id} criado com sucesso!`);
      return {
        ok: true,
        data: {
          id,
          name,
          applies_to,
          created_at,
        },
      };
    } catch (error) {
      Logger.error(`Erro ao criar o tipo: ${error}`);
      return {
        ok: false,
        reason: 'error',
        message: 'Erro ao criar o tipo.',
      };
    }
  }

  return {
    ok: false,
    reason: 'error',
    message: 'Dados inválidos para criação do tipo.',
  };
}

export async function findTypeByIdService(
  id: number,
  userId: number,
): Promise<ServiceResult<Omit<TypesModel, 'user_id'>>> {
  Logger.debug(`Iniciado busca pelo tipo com id ${id}`);

  try {
    const foundUser = await findUserById(userId);
    if (!foundUser) {
      Logger.error('Usuário não encontrado.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Usuário não foi encontrado.',
      };
    }

    const foundType = await findTypeById(id, userId);
    if (!foundType) {
      Logger.error('Tipo não encontrado.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Tipo não foi encontrado.',
      };
    }

    const { name, applies_to, created_at, updated_at } = foundType;
    Logger.info('Tipo foi encontrado!');
    return {
      ok: true,
      data: { id, name, applies_to, created_at, updated_at },
    };
  } catch (error) {
    Logger.error(`Erro ao procurar o tipo: ${error}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao buscar o tipo.',
    };
  }
}
