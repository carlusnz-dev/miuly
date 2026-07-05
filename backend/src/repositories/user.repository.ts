import type {
  UserCreateInput,
  UserModel,
  UserUpdateInput,
} from '../generated/prisma/models.js';
import { prisma } from '../lib/prisma.js';

export async function createUser(data: UserCreateInput) {
  return prisma.user.create({ data, omit: { password: true } });
}

export async function updateUser(data: UserUpdateInput, userId: number) {
  return prisma.user.update({
    data,
    where: { id: userId },
    omit: { password: true },
  });
}

export async function deleteUser(userId: number) {
  return prisma.user.delete({
    where: { id: userId },
    omit: { password: true },
  });
}

export async function findUserByEmailOrUsername(
  data: UserModel,
  excludeId?: number,
) {
  return prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }],
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
}

export async function findAllUsers() {
  return prisma.user.findMany({ omit: { password: true } });
}

export async function findUserById(userId: number) {
  return prisma.user.findFirst({
    where: { id: userId },
    omit: { password: true },
  });
}
