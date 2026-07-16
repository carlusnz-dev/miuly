import type {
  BankModel,
  BankUncheckedCreateInput,
  BankUncheckedUpdateInput,
} from '../generated/prisma/models.js';
import Logger from '../lib/logger.js';
import {
  createBank,
  deleteBank,
  findBankById,
  findAllBanksByUserId,
  updateBank,
} from '../repositories/bank.repository.js';
import { findUserById } from '../repositories/user.repository.js';
import type {
  ServiceNoDataResult,
  ServiceResult,
} from '../types/result.type.js';

export async function createBankService(
  data: Pick<BankUncheckedCreateInput, 'id' | 'name' | 'balance'>,
  userId: number,
): Promise<
  ServiceResult<Pick<BankModel, 'id' | 'name' | 'balance' | 'created_at'>>
> {
  const foundUser = await findUserById(userId);

  if (!foundUser) {
    Logger.error(`Usuário ID ${userId} não foi encontrado.`);
    return {
      ok: false,
      reason: 'not_found',
      message: `Usuário ID ${userId} não foi encontrado.`,
    };
  }

  if (data) {
    try {
      const newBank = await createBank(data, userId);
      const { id, name, balance, created_at } = newBank;
      return {
        ok: true,
        data: {
          id,
          name,
          balance,
          created_at,
        },
      };
    } catch (error) {
      Logger.error(`Erro ao criar novo banco: ${error}`);
      return {
        ok: false,
        reason: 'error',
        message: 'Erro ao criar o banco.',
      };
    }
  }

  return {
    ok: false,
    reason: 'error',
    message: 'Dados inválidos para criação do banco.',
  };
}

export async function updateBankService(
  data: Pick<BankUncheckedUpdateInput, 'name' | 'balance'>,
  id: number,
  userId: number,
): Promise<
  ServiceResult<Pick<BankModel, 'id' | 'name' | 'balance' | 'updated_at'>>
> {
  const foundUser = await findUserById(userId);
  const foundBank = await findBankById(id);

  if (!foundUser) {
    Logger.error(`Usuário ID ${userId} não foi encontrado.`);
    return {
      ok: false,
      reason: 'not_found',
      message: 'Usuário não foi encontrado.',
    };
  }

  if (!foundBank) {
    Logger.error(`Banco ID ${id} não foi encontrado.`);
    return {
      ok: false,
      reason: 'not_found',
      message: 'Banco não foi encontrado.',
    };
  }

  if (data) {
    try {
      const updatedBank = await updateBank(data, id, userId);
      Logger.info(`Banco ID ${id} foi atualizado com sucesso!`);
      return {
        ok: true,
        data: updatedBank,
      };
    } catch (error) {
      Logger.error(`Erro ao atualizar o banco: ${error}`);
    }
  }

  return {
    ok: false,
    reason: 'error',
    message: 'Dados inválidos para atualizar o banco.',
  };
}

export async function deleteBankService(
  id: number,
  userId: number,
): Promise<
  ServiceNoDataResult<string, Pick<BankModel, 'id' | 'name' | 'balance'>>
> {
  const foundBank = await findBankById(id);
  const foundUser = await findUserById(userId);

  if (!foundBank) {
    Logger.error(`Banco ID ${id} não foi encontrado.`);
    return {
      ok: false,
      reason: 'not_found',
      message: 'Não foi encontrado nenhum banco com esse ID.',
    };
  }

  if (!foundUser) {
    Logger.error(`Usuário ID ${userId} não foi encontrado.`);
    return {
      ok: false,
      reason: 'not_found',
      message: 'Nenhum usuário com esse ID foi encontrado.',
    };
  }

  if (foundBank.user_id == foundUser.id) {
    try {
      const removedBank = await deleteBank(id, userId);
      Logger.info(`Banco ${id} foi apagado com sucesso!`);
      return {
        ok: true,
        message: `Banco ${id} foi apagado com sucesso.`,
        data: removedBank,
      };
    } catch (error) {
      Logger.error(`Erro ao apagar o banco: ${error}`);
      return {
        ok: false,
        reason: 'unauthorized',
        message: 'O banco não pertence a este usuário.',
      };
    }
  }

  if (foundBank.user_id != foundUser.id) {
    return {
      ok: false,
      reason: 'unauthorized',
      message: 'O banco não pertence a este usuário.',
    };
  }

  return {
    ok: false,
    reason: 'error',
    message: 'Dados inválidos para deletar o banco.',
  };
}

export async function findBankByIdService(
  id: number,
): Promise<ServiceResult<BankModel>> {
  const foundBank = await findBankById(id);

  if (!foundBank) {
    Logger.error(`Banco ID ${id} não foi encontrado.`);
    return {
      ok: false,
      reason: 'not_found',
      message: 'Não foi encontrado nenhum banco com esse ID.',
    };
  }

  if (foundBank) {
    return {
      ok: true,
      data: foundBank,
    };
  }

  return {
    ok: false,
    reason: 'error',
    message: 'Dados inválidos para buscar o banco.',
  };
}

export async function findAllBanksByUserIdService(
  userId: number,
): Promise<
  ServiceResult<Pick<BankModel, 'id' | 'name' | 'balance' | 'created_at'>[]>
> {
  const foundUser = await findUserById(userId);

  if (!foundUser) {
    Logger.error(`Usuário ID ${userId} não foi encontrado.`);
    return {
      ok: false,
      reason: 'not_found',
      message: 'Nenhum usuário foi encontrado.',
    };
  }

  try {
    const foundAllBanks = await findAllBanksByUserId(userId);
    Logger.info('Todos os bancos foram encontrados.');
    return {
      ok: true,
      data: foundAllBanks,
    };
  } catch (error) {
    Logger.error(`Erro ao procurar os bancos: ${error}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao procurar os bancos.',
    };
  }
}
