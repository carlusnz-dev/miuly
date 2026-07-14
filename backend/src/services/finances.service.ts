import type {
  FinancesModel,
  FinancesUncheckedCreateInput,
} from '../generated/prisma/models.js';
import Logger from '../lib/logger.js';
import {
  createFinance,
  findAllFinancesByUserId as findAllFinancesRepo,
} from '../repositories/finances.repository.js';
import { findUserById } from '../repositories/user.repository.js';
import type { ServiceResult } from '../types/result.type.js';

export async function createFinancesService(
  data: Pick<
    FinancesUncheckedCreateInput,
    'name' | 'description' | 'value' | 'bank_id' | 'type_id'
  >,
  userId: number,
): Promise<ServiceResult<Omit<FinancesModel, 'user_id'>>> {
  const foundUser = await findUserById(userId);
  if (!foundUser) {
    Logger.error('Usuário não encontrado! ID: ', userId);
    return {
      ok: false,
      reason: 'not_found',
      message: 'Usuário especificado não existe.',
    };
  }

  if (data) {
    try {
      const newFinance = await createFinance(data, userId);
      return {
        ok: true,
        data: newFinance,
      };
    } catch (error) {
      Logger.error('Erro ao criar nova finança: ', error);
      return {
        ok: false,
        reason: 'error',
        message: 'Erro ao criar nova finança.',
      };
    }
  }

  return {
    ok: false,
    reason: 'error',
    message: 'Dados inválidos para criação da finança.',
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
        message: 'Não encontrado nenhuma finança.',
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
