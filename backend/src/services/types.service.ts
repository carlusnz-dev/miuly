import type { TypesModel } from '../generated/prisma/models.js';
import Logger from '../lib/logger.js';
import { countFinancesByTypeId } from '../repositories/finances.repository.js';
import { countTasksByTypeId } from '../repositories/task.repository.js';
import {
  createType,
  deleteType,
  findAllTypesByUserId,
  findTypeById,
  updateType,
} from '../repositories/types.repository.js';
import { findUserById } from '../repositories/user.repository.js';
import type { ServiceResult } from '../types/result.type.js';
import type { CreateTypeInput, UpdateTypeInput } from '../types/types.type.js';

// O Prisma sinaliza violação de constraint por código: P2002 é unicidade
// (@@unique([user_id, name])) e P2003 é chave estrangeira (onDelete: Restrict).
function isPrismaErrorCode(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

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
      if (isPrismaErrorCode(error, 'P2002')) {
        Logger.error('Já existe um tipo com esse nome para este usuário.');
        return {
          ok: false,
          reason: 'conflict',
          message: 'Você já tem um tipo com esse nome.',
        };
      }

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

export async function findAllTypesByUserIdService(
  userId: number,
): Promise<ServiceResult<Omit<TypesModel, 'user_id'>[]>> {
  Logger.debug('Iniciado busca por todos os tipos do usuário.');

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

    const foundTypes = await findAllTypesByUserId(userId);
    if (foundTypes.length == 0) {
      Logger.info('Não foi encontrado nenhum tipo para este usuário.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Não há tipos registrados neste usuário.',
      };
    }

    Logger.info('Todos os tipos foram encontrados.');
    return {
      ok: true,
      data: foundTypes,
    };
  } catch (error) {
    Logger.error(`Erro ao procurar os tipos: ${error}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao procurar os tipos.',
    };
  }
}

export async function updateTypeService(
  id: number,
  userId: number,
  data: UpdateTypeInput,
): Promise<
  ServiceResult<Pick<TypesModel, 'id' | 'name' | 'applies_to' | 'updated_at'>>
> {
  Logger.debug('Iniciado a atualização de Type.');

  try {
    const foundUser = await findUserById(userId);
    const foundType = await findTypeById(id, userId);
    if (!foundUser || !foundType) {
      Logger.error('Não foi encontrado nenhum usuário ou tipo.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Não foi encontrado tipo ou usuário.',
      };
    }

    const updatedType = await updateType(id, userId, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.applies_to !== undefined && { applies_to: data.applies_to }),
    });
    const { name, applies_to, updated_at } = updatedType;
    Logger.info(`Tipo ID ${id} atualizado com sucesso!`);
    return {
      ok: true,
      data: { id, name, applies_to, updated_at },
    };
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2002')) {
      Logger.error('Já existe um tipo com esse nome para este usuário.');
      return {
        ok: false,
        reason: 'conflict',
        message: 'Você já tem um tipo com esse nome.',
      };
    }

    Logger.error(`Erro ao atualizar o tipo: ${error}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao atualizar o tipo.',
    };
  }
}

export async function deleteTypeService(
  id: number,
  userId: number,
): Promise<ServiceResult<Pick<TypesModel, 'id' | 'name' | 'created_at'>>> {
  Logger.debug('Iniciado a remoção de Type.');

  try {
    const foundUser = await findUserById(userId);
    const foundType = await findTypeById(id, userId);
    if (!foundUser || !foundType) {
      Logger.error('Não foi encontrado nenhum usuário ou tipo.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Não foi encontrado tipo ou usuário.',
      };
    }

    // As FKs de Finances e Task são Restrict: o banco recusaria a deleção.
    // Checar antes permite responder o motivo em vez de um erro genérico.
    const financesEmUso = await countFinancesByTypeId(id, userId);
    const tasksEmUso = await countTasksByTypeId(id, userId);
    if (financesEmUso > 0 || tasksEmUso > 0) {
      Logger.error(`Tipo ID ${id} está em uso e não pode ser removido.`);
      return {
        ok: false,
        reason: 'conflict',
        message: `Este tipo está em uso por ${financesEmUso} finança(s) e ${tasksEmUso} tarefa(s).`,
      };
    }

    const deletedType = await deleteType(id, userId);
    const { name, created_at } = deletedType;
    Logger.info(`Tipo ID ${id} deletado com sucesso!`);
    return {
      ok: true,
      data: { id, name, created_at },
    };
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2003')) {
      Logger.error(`Tipo ID ${id} está em uso e não pode ser removido.`);
      return {
        ok: false,
        reason: 'conflict',
        message: 'Este tipo está em uso e não pode ser removido.',
      };
    }

    Logger.error(`Erro ao deletar o tipo: ${error}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao deletar o tipo.',
    };
  }
}
