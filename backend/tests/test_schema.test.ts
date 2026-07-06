import { describe, it, expect } from 'vitest';
import { createUserSchema } from '../src/types/user.type.js';

describe('createUserSchema', () => {
  it('rejeita senha com menos de 8 caracteres', () => {
    const r = createUserSchema.safeParse({
      username: 'carlos',
      email: 'c@teste.com',
      password: '123',
    });

    expect(r.success).toBe(false);
  });

  it('descarta campos não declarados', () => {
    const r = createUserSchema.safeParse({
      username: 'carlos',
      email: 'c@teste.com',
      password: '12345678',
      role: 'ADMIN',
    });

    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty('role');
  });
});
