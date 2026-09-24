import type { AuthUser } from './contract';
import type { StoredRefreshToken } from './repository';

export function makeAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1,
    name: 'Ana',
    email: 'ana@example.com',
    profile: {
      id: '0f8fad5b-d9cb-469f-a165-70867728950e',
      username: 'ana',
      slugUrl: 'ana',
      urlPhoto: null,
    },
    ...overrides,
  };
}

export function makeStoredToken(
  overrides: Partial<StoredRefreshToken> = {},
): StoredRefreshToken {
  return {
    id: 'token-1',
    sessionId: 'session-1',
    userId: 1,
    expiresAt: new Date('2026-10-01T00:00:00Z'),
    sessionRevokedAt: null,
    successorCreatedAt: null,
    ...overrides,
  };
}
