import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { parseEnv as ParseEnv } from './env';

let parseEnv: typeof ParseEnv;

beforeAll(async () => {
  vi.stubEnv('DATABASE_URL', 'postgresql://miuly:miuly@localhost:5436/miuly');
  ({ parseEnv } = await import('./env'));
  vi.unstubAllEnvs();
});

describe('parseEnv', () => {
  it('aplica padrões quando apenas DATABASE_URL é informada', () => {
    const env = parseEnv({ DATABASE_URL: 'postgres://u:p@localhost:5432/db' });

    expect(env).toEqual({
      NODE_ENV: 'development',
      PORT: 8080,
      DATABASE_URL: 'postgres://u:p@localhost:5432/db',
    });
  });

  it('converte PORT para número', () => {
    const env = parseEnv({
      DATABASE_URL: 'postgresql://u@localhost/db',
      PORT: '3000',
      NODE_ENV: 'production',
    });

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('production');
  });

  it.each([
    ['DATABASE_URL ausente', {}],
    ['protocolo que não é PostgreSQL', { DATABASE_URL: 'mysql://u@h/db' }],
    ['PORT não numérica', { DATABASE_URL: 'postgres://u@h/db', PORT: 'abc' }],
    [
      'PORT fora do intervalo',
      { DATABASE_URL: 'postgres://u@h/db', PORT: '70000' },
    ],
    [
      'NODE_ENV desconhecido',
      { DATABASE_URL: 'postgres://u@h/db', NODE_ENV: 'staging' },
    ],
  ])('rejeita %s', (_caso, source) => {
    expect(() => parseEnv(source)).toThrow('Variáveis de ambiente inválidas');
  });
});
