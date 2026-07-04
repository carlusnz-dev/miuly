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
