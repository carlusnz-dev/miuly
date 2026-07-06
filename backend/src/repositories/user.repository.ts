import type {
  UserCreateInput,
  UserModel,
  UserUpdateInput,
} from '../generated/prisma/models.js';
import { prisma } from '../lib/prisma.js';

export async function createUser(
  data: Pick<UserCreateInput, 'username' | 'email' | 'password'>,
) {
  return prisma.user.create({ data, omit: { password: true } });
}

export async function updateUser(
  data: Partial<Pick<UserUpdateInput, 'email' | 'username'>>,
  userId: number,
) {
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
  data: Partial<Pick<UserModel, 'email' | 'username'>>,
  excludeId?: number,
) {
  return prisma.user.findFirst({
    where: {
      OR: [
        ...(data.username ? [{ username: data.username }] : []),
        ...(data.email ? [{ email: data.email }] : []),
      ],
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
