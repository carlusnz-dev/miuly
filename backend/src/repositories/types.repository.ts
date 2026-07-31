import type { TypesUncheckedUpdateInput } from '../generated/prisma/models.js';
import { prisma } from '../lib/prisma.js';
import type { CreateTypeInput } from '../types/types.type.js';

export async function createType(data: CreateTypeInput, userId: number) {
  return prisma.types.create({ data: { ...data, user_id: userId } });
}

export async function updateType(
  id: number,
  userId: number,
  data: Partial<Pick<TypesUncheckedUpdateInput, 'name' | 'applies_to'>>,
) {
  return prisma.types.update({
    data,
    where: { id, user_id: userId },
  });
}

export async function deleteType(id: number, userId: number) {
  return prisma.types.delete({
    where: { id, user_id: userId },
  });
}

export async function findTypeById(id: number, userId: number) {
  return prisma.types.findFirst({
    where: { id, user_id: userId },
  });
}

export async function findAllTypesByUserId(userId: number) {
  return prisma.types.findMany({
    where: { user_id: userId },
    omit: { user_id: true },
    orderBy: { name: 'asc' },
  });
}
