import type { UserCreateInput, UserModel } from '../generated/prisma/models.js';
import { prisma } from '../lib/prisma.js';

export async function createUser(data: UserCreateInput) {
  return prisma.user.create({ data });
}

export async function findUserByEmailOrUsername(data: UserModel) {}
