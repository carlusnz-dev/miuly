import type { FinancesModel } from '../generated/prisma/models.js';
import Logger from '../lib/logger.js';
import { findBankById } from '../repositories/bank.repository.js';
import {
  createFinance,
  deleteFinance,
  findAllFinancesByUserId as findAllFinancesRepo,
  findFinanceById,
  updateFinance,
} from '../repositories/finances.repository.js';
import { findTypeById } from '../repositories/types.repository.js';
import { findUserById } from '../repositories/user.repository.js';
import type {
  CreateFinanceInput,
  UpdateFinanceInput,
} from '../types/finances.type.js';
import type { ServiceResult } from '../types/result.type.js';

export async function createFinancesService(
  data: Pick<
    CreateFinanceInput,
    'name' | 'description' | 'value' | 'bank_id' | 'type_id'
  >,
  userId: number,
): Promise<
  ServiceResult<Pick<FinancesModel, 'id' | 'name' | 'value' | 'created_at'>>
> {
  Logger.debug('Iniciado a criação de Finance.');

  // adicionado try/catch agora como
  // padrão de todo create/update
  try {
    // procura do usuário
    const foundUser = await findUserById(userId);
    if (!foundUser) {
      Logger.error('Usuário não encontrado!');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Usuário não foi encontrado.',
      };
    }

    // procura do banco e tipo
    const foundBank = await findBankById(data.bank_id);
    const foundType = await findTypeById(data.type_id, userId);
    if (!foundBank) {
      Logger.error('Banco não encontrado.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Banco não foi encontrado.',
      };
    }
    if (!foundType || userId != foundType.user_id) {
      Logger.error('Tipo não encontrado.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Tipo não foi encontrado.',
      };
    }

    // verificação do tipo da finança
    if (!foundType.applies_to.includes('FINANCES')) {
      Logger.error('O tipo fornecido não contém FINANCES.');
      return {
        ok: false,
        reason: 'error',
        message: 'O tipo fornecido não pertence a FINANCES.',
      };
    }

    const newFinance = await createFinance(data, userId);
    const { id, name, value, created_at } = newFinance;
    Logger.info('Finança criada com sucesso!');
    return {
      ok: true,
      data: { id, name, value, created_at },
    };
  } catch (error) {
    Logger.error(`Erro ao criar a finança: ${error}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao criar a finança.',
    };
  }
}

export async function updateFinanceService(
  id: number,
  userId: number,
  data: UpdateFinanceInput,
): Promise<
  ServiceResult<
    Pick<
      FinancesModel,
      'name' | 'description' | 'value' | 'bank_id' | 'type_id' | 'updated_at'
    >
  >
> {
  Logger.debug('Iniciado a atualização de Finance.');

  // try/catch aplicado
  try {
    // procura do usuário e da finança
    const foundUser = await findUserById(userId);
    const foundFinance = await findFinanceById(id, userId);
    if (!foundUser || !foundFinance) {
      Logger.error('Não foi encontrado nenhum usuário ou finança.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Não foi encontrado finança ou usuário.',
      };
    }

    // valida o banco só se ele estiver sendo alterado
    if (data.bank_id !== undefined) {
      const foundBank = await findBankById(data.bank_id);
      if (!foundBank) {
        Logger.error('Banco não encontrado.');
        return {
          ok: false,
          reason: 'not_found',
          message: 'Banco não foi encontrado.',
        };
      }
    }

    // valida o tipo só se ele estiver sendo alterado
    if (data.type_id !== undefined) {
      const foundType = await findTypeById(data.type_id, userId);
      if (!foundType || userId != foundType.user_id) {
        Logger.error('Tipo não encontrado.');
        return {
          ok: false,
          reason: 'not_found',
          message: 'Tipo não foi encontrado.',
        };
      }
      if (!foundType.applies_to.includes('FINANCES')) {
        Logger.error('O tipo fornecido não contém FINANCES.');
        return {
          ok: false,
          reason: 'error',
          message: 'O tipo fornecido não pertence a FINANCES.',
        };
      }
    }

    const updatedFinance = await updateFinance(id, userId, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.bank_id !== undefined && { bank_id: data.bank_id }),
      ...(data.type_id !== undefined && { type_id: data.type_id }),
    });
    const { name, description, value, bank_id, type_id, updated_at } =
      updatedFinance;
    Logger.info(`Finança ID ${id} atualizada com sucesso!`);
    return {
      ok: true,
      data: {
        name,
        description,
        value,
        bank_id,
        type_id,
        updated_at,
      },
    };
  } catch (error) {
    Logger.error(`Erro ao atualizar a finança: ${error}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao atualizar a finança.',
    };
  }
}

export async function deleteFinanceService(
  id: number,
  userId: number,
): Promise<ServiceResult<Pick<FinancesModel, 'id' | 'name' | 'created_at'>>> {
  const foundFinance = await findFinanceById(id, userId);
  const foundUser = await findUserById(userId);

  if (!foundFinance || !foundUser) {
    Logger.error('Não foi encontrado nenhum usuário ou finança.');
    return {
      ok: false,
      reason: 'not_found',
      message: 'Não foi encontrado finança ou usuário.',
    };
  }

  // Decisão: deixar conflito de userId como status 'not_found'
  // por questões de segurança e exploração de vulnerabilidades
  if (foundFinance.user_id != userId) {
    Logger.error('Erro ao deletar a finança: não pertence ao usuário.');
    return {
      ok: false,
      reason: 'not_found',
      message: 'Não foi encontrado a finança especificada.',
    };
  }

  if (id) {
    try {
      const deletedFinance = await deleteFinance(id, userId);
      Logger.info(`Finança ID ${id} deletada com sucesso!`);
      return {
        ok: true,
        data: deletedFinance,
      };
    } catch (error) {
      Logger.error(`Erro ao deletar a finança: ${error}`);
      return {
        ok: false,
        reason: 'error',
        message: 'Erro ao deletar a finança.',
      };
    }
  }

  return {
    ok: false,
    reason: 'error',
    message: 'Dados inválidos para apagar a finança.',
  };
}

export async function findAllFinancesByUserIdService(
  userId: number,
): Promise<ServiceResult<Omit<FinancesModel, 'user_id'>[]>> {
  const foundUser = await findUserById(userId);
  if (!foundUser) {
    Logger.error('Usuário não encontrado! ID: ', userId);
    return {
      ok: false,
      reason: 'not_found',
      message: 'Usuário especificado não existe.',
    };
  }

  try {
    const foundAllFinances = await findAllFinancesRepo(userId);

    if (!foundAllFinances || foundAllFinances.length === 0) {
      return {
        ok: false,
        reason: 'not_found',
        message: 'Não foi encontrado nenhuma finança.',
      };
    }

    Logger.info('Foi encontrado X finanças!');
    return {
      ok: true,
      data: foundAllFinances,
    };
  } catch (error) {
    Logger.error('Erro ao buscar finanças: ', error);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao buscar finanças.',
    };
  }
}
