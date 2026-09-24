import { createHash, randomBytes } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';
import * as z from 'zod';
import type { AuthContext } from '../../core/types/auth';
import { ACCESS_TOKEN_TTL_SECONDS } from './contract';

export interface TokenService {
  issueAccessToken(context: AuthContext): Promise<string>;
  // null para token ausente, malformado, com assinatura inválida ou expirado.
  verifyAccessToken(token: string): Promise<AuthContext | null>;
  generateRefreshToken(): string;
  hashRefreshToken(token: string): string;
}

const ALGORITHM = 'HS256';
const ISSUER = 'miuly-api';
const AUDIENCE = 'miuly-spa';
const REFRESH_TOKEN_BYTES = 32;

const claimsSchema = z.object({
  sub: z.string().regex(/^[1-9]\d*$/),
  pid: z.uuid(),
});

export class JoseTokenService implements TokenService {
  private readonly key: Uint8Array;

  constructor(secret: string) {
    this.key = new TextEncoder().encode(secret);
  }

  issueAccessToken(context: AuthContext): Promise<string> {
    return new SignJWT({ pid: context.profileId })
      .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
      .setSubject(String(context.userId))
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(this.key);
  }

  async verifyAccessToken(token: string): Promise<AuthContext | null> {
    try {
      // `algorithms` fixo impede tokens com alg "none" ou trocado.
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: [ALGORITHM],
        issuer: ISSUER,
        audience: AUDIENCE,
      });
      const claims = claimsSchema.safeParse(payload);

      if (!claims.success) {
        return null;
      }

      return { userId: Number(claims.data.sub), profileId: claims.data.pid };
    } catch {
      return null;
    }
  }

  generateRefreshToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
  }

  // SHA-256 em hex: 64 caracteres, o tamanho de refresh_tokens.token_hash.
  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
