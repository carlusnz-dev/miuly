import type {
  FinancesUncheckedCreateInput,
  FinancesUncheckedUpdateInput,
} from '../generated/prisma/models.js';
import { prisma } from '../lib/prisma.js';

export async function createFinance(
  data: Pick<
    FinancesUncheckedCreateInput,
    'name' | 'description' | 'value' | 'bank_id' | 'type_id'
  >,
  userId: number,
) {
  return prisma.finances.create({ data: { ...data, user_id: userId } });
}

export async function updateFinance(
  id: number,
  userId: number,
  data: Pick<
    FinancesUncheckedUpdateInput,
    'name' | 'description' | 'value' | 'bank_id' | 'type_id'
  >,
) {
  return prisma.finances.update({ data, where: { id, user_id: userId } });
}

export async function deleteFinance(id: number, userId: number) {
  return prisma.finances.delete({
    where: { id, user_id: userId },
  });
}

export async function findFinanceById(id: number, userId: number) {
  return prisma.finances.findFirst({
    where: { id, user_id: userId },
  });
}

export async function findAllFinancesByUserId(userId: number) {
  return prisma.finances.findMany({
    where: { user_id: userId },
  });
}
