import type {
  BankUncheckedCreateInput,
  BankUncheckedUpdateInput,
} from '../generated/prisma/models.js';
import { prisma } from '../lib/prisma.js';

export async function createBank(
  data: Pick<BankUncheckedCreateInput, 'name' | 'balance'>,
  userId: number,
) {
  return prisma.bank.create({
    data: { ...data, user_id: userId },
  });
}

export async function updateBank(
  data: Pick<BankUncheckedUpdateInput, 'name' | 'balance'>,
  id: number,
  userId: number,
) {
  return prisma.bank.update({
    data,
    where: {
      id,
      user_id: userId,
    },
  });
}

export async function deleteBank(id: number, userId: number) {
  return prisma.bank.delete({
    where: {
      id,
      user_id: userId,
    },
  });
}

export async function findBankById(id: number) {
  return prisma.bank.findFirst({ where: { id } });
}

export async function findAllBanksByUserId(userId: number) {
  return prisma.bank.findMany({ where: { user_id: userId } });
}
