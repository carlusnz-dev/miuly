import { describe, expect, it } from 'vitest';
import { ScryptPasswordHasher } from './password';

const hasher = new ScryptPasswordHasher();

describe('ScryptPasswordHasher', () => {
  it('gera hash com parâmetros e salt, e verifica a senha correta', async () => {
    const hash = await hasher.hash('senha-segura');

    expect(hash).toMatch(/^scrypt\$32768\$8\$1\$[\w-]+\$[\w-]+$/);
    expect(await hasher.verify('senha-segura', hash)).toBe(true);
  });

  it('rejeita senha errada', async () => {
    const hash = await hasher.hash('senha-segura');

    expect(await hasher.verify('senha-errada', hash)).toBe(false);
  });

  it('usa salt diferente a cada hash', async () => {
    expect(await hasher.hash('igual')).not.toBe(await hasher.hash('igual'));
  });

  it.each(['', 'texto', 'bcrypt$1$2$3$a$b', 'scrypt$x$8$1$a$b'])(
    'trata hash armazenado inválido "%s" como senha inválida',
    async (stored) => {
      expect(await hasher.verify('qualquer', stored)).toBe(false);
    },
  );
});
