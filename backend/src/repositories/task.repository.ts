import type {
  TaskUncheckedCreateInput,
  TaskUncheckedUpdateInput,
} from '../generated/prisma/models.js';
import { prisma } from '../lib/prisma.js';

export async function createTask(
  data: Pick<
    TaskUncheckedCreateInput,
    'name' | 'description' | 'priority' | 'type_id' | 'due_date' | 'sync'
  >,
  userId: number,
) {
  return prisma.task.create({ data: { ...data, user_id: userId } });
}

export async function updateTask(
  id: number,
  userId: number,
  data: Partial<
    Pick<
      TaskUncheckedUpdateInput,
      'name' | 'description' | 'priority' | 'type_id' | 'due_date' | 'sync'
    >
  >,
) {
  return prisma.task.update({
    data,
    where: { id, user_id: userId },
  });
}

export async function deleteTask(id: number, userId: number) {
  return prisma.task.delete({
    where: { id, user_id: userId },
  });
}

export async function findTaskById(id: number, userId: number) {
  return prisma.task.findFirst({
    where: { id, user_id: userId },
  });
}

export async function countTasksByTypeId(typeId: number, userId: number) {
  return prisma.task.count({
    where: { type_id: typeId, user_id: userId },
  });
}

export async function findAllTasksByUserId(userId: number) {
  return prisma.task.findMany({
    where: { user_id: userId },
    omit: { user_id: true },
    orderBy: { due_date: 'asc' },
  });
}
