import type { UserCreateInput, UserModel } from '../generated/prisma/models.js';
import { prisma } from '../lib/prisma.js';

export async function createUser(data: UserCreateInput) {
  return prisma.user.create({ data, omit: { password: true } });
}

export async function findUserByEmailOrUsername(data: UserModel) {
  return prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { username: data.username }] },
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
