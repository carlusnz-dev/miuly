import { prisma } from '../lib/prisma.js';
import type { UserCreateInput } from '../generated/prisma/models.js';
import bcrypt from 'bcrypt';
import { createUser } from '../repositories/user.repository.js';

export async function createUserService(data: UserCreateInput) {
  if (data) {
    // Verificar email e username
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email, username: data.username },
    });
    if (existingUser) {
      console.log('E-mail ou nome de usuário já existente.');
      return null;
    }

    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(data.password, saltRounds);
    console.log('Senha com hash feita.');

    // criar novo user
    try {
      return await createUser({
        ...data,
        password: hashedPassword,
      });
    } catch (e) {
      return `Erro ao criar usuário: ${e}`;
    }
  }

  console.log('Erro ao carregar data para criar novo usuário.');
}
