import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// Porta usada por auth (cadastro e login) e users (troca de senha).
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, stored: string): Promise<boolean>;
}

// Parâmetros do ADR 0002. O hash guarda os parâmetros para permitir aumentar o
// custo depois sem invalidar senhas antigas.
const COST = 2 ** 15;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const MAX_MEMORY = 64 * 1024 * 1024;

interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

function derive(
  password: string,
  salt: Buffer,
  params: ScryptParams,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      { ...params, maxmem: MAX_MEMORY },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

// Formato: scrypt$N$r$p$salt$hash, com salt e hash em base64url.
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const params = { N: COST, r: BLOCK_SIZE, p: PARALLELISM };
    const key = await derive(password, salt, params);

    return [
      'scrypt',
      params.N,
      params.r,
      params.p,
      salt.toString('base64url'),
      key.toString('base64url'),
    ].join('$');
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const parts = stored.split('$');

    if (parts.length !== 6 || parts[0] !== 'scrypt') {
      return false;
    }

    const [, n, r, p, salt, hash] = parts;
    const params = { N: Number(n), r: Number(r), p: Number(p) };

    if (!Object.values(params).every(Number.isSafeInteger)) {
      return false;
    }

    const expected = Buffer.from(hash ?? '', 'base64url');

    try {
      const key = await derive(
        password,
        Buffer.from(salt ?? '', 'base64url'),
        params,
      );

      return expected.length === key.length && timingSafeEqual(expected, key);
    } catch {
      // Parâmetros corrompidos no hash armazenado: trata como senha inválida.
      return false;
    }
  }
}
