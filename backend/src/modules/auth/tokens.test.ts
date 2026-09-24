import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { JoseTokenService } from './tokens';

const SECRET = 'segredo-de-teste-com-32-caracteres!';
const context = {
  userId: 7,
  profileId: '0f8fad5b-d9cb-469f-a165-70867728950e',
};
const service = new JoseTokenService(SECRET);
const key = new TextEncoder().encode(SECRET);

function signed(claims: Record<string, unknown>, expiresIn = '15m') {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('miuly-api')
    .setAudience('miuly-spa')
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

describe('JoseTokenService', () => {
  it('emite e valida o access token', async () => {
    const token = await service.issueAccessToken(context);

    await expect(service.verifyAccessToken(token)).resolves.toEqual(context);
  });

  it('rejeita token assinado com outro segredo', async () => {
    const other = new JoseTokenService(
      'outro-segredo-com-mais-de-32-caracteres',
    );
    const token = await other.issueAccessToken(context);

    await expect(service.verifyAccessToken(token)).resolves.toBeNull();
  });

  it('rejeita token adulterado', async () => {
    const token = await service.issueAccessToken(context);
    const [header, , signature] = token.split('.');
    const payload = Buffer.from(
      JSON.stringify({ sub: '1', pid: context.profileId }),
    ).toString('base64url');

    await expect(
      service.verifyAccessToken(`${header}.${payload}.${signature}`),
    ).resolves.toBeNull();
  });

  it('rejeita token sem assinatura (alg none)', async () => {
    const header = Buffer.from('{"alg":"none"}').toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({ sub: '7', pid: context.profileId }),
    ).toString('base64url');

    await expect(
      service.verifyAccessToken(`${header}.${payload}.`),
    ).resolves.toBeNull();
  });

  it('rejeita token expirado', async () => {
    const token = await signed({ sub: '7', pid: context.profileId }, '-1s');

    await expect(service.verifyAccessToken(token)).resolves.toBeNull();
  });

  it('rejeita claims fora do formato', async () => {
    const token = await signed({ sub: 'abc', pid: 'nao-e-uuid' });

    await expect(service.verifyAccessToken(token)).resolves.toBeNull();
  });

  it('gera refresh tokens aleatórios e hash SHA-256 de 64 caracteres', () => {
    const a = service.generateRefreshToken();
    const b = service.generateRefreshToken();

    expect(a).not.toBe(b);
    expect(service.hashRefreshToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(service.hashRefreshToken(a)).toBe(service.hashRefreshToken(a));
  });
});
