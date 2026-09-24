import { describe, expect, it, vi } from 'vitest';
import { NotFoundError, UnauthorizedError } from '../../core/error';
import type { PasswordHasher } from '../../core/security/password';
import { makeProfile, makeUser } from './fixtures';
import type { UserRepository } from './repository';
import {
  UserServiceImpl,
  type SessionRevoker,
  type UserService,
} from './service';

function setup(overrides: Partial<UserRepository> = {}) {
  const repository: UserRepository = {
    findById: vi.fn(async () => makeUser()),
    updateName: vi.fn(async (_id, name) => makeUser({ name })),
    findPasswordHash: vi.fn(async () => 'hash-atual'),
    updatePasswordHash: vi.fn(async () => {}),
    findProfileByUserId: vi.fn(async () => makeProfile()),
    updateProfile: vi.fn(async () => makeProfile({ username: 'bia' })),
    ...overrides,
  };
  const passwords: PasswordHasher = {
    hash: vi.fn(async () => 'hash-novo'),
    verify: vi.fn(async (password) => password === 'senha-atual'),
  };
  const sessions: SessionRevoker = { revokeAllSessions: vi.fn(async () => {}) };
  const service: UserService = new UserServiceImpl(repository, {
    passwords,
    sessions,
  });

  return { service, repository, passwords, sessions };
}

describe('UserServiceImpl.findMe', () => {
  it('retorna o usuário autenticado', async () => {
    const { service, repository } = setup();

    await expect(service.findMe(1)).resolves.toEqual(makeUser());
    expect(repository.findById).toHaveBeenCalledWith(1);
  });

  it('lança NotFoundError quando o usuário não existe mais', async () => {
    const { service } = setup({ findById: vi.fn(async () => null) });

    await expect(service.findMe(1)).rejects.toThrow(NotFoundError);
  });
});

describe('UserServiceImpl.updateMe', () => {
  it('atualiza o nome', async () => {
    const { service, repository } = setup();

    await expect(service.updateMe(1, { name: 'Bia' })).resolves.toMatchObject({
      name: 'Bia',
    });
    expect(repository.updateName).toHaveBeenCalledWith(1, 'Bia');
  });

  it('lança NotFoundError quando nenhuma linha é atualizada', async () => {
    const { service } = setup({ updateName: vi.fn(async () => null) });

    await expect(service.updateMe(1, { name: 'Bia' })).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe('UserServiceImpl.changePassword', () => {
  const input = { currentPassword: 'senha-atual', newPassword: 'senha-nova-1' };

  it('grava o novo hash e revoga todas as sessões', async () => {
    const { service, repository, passwords, sessions } = setup();

    await service.changePassword(1, input);

    expect(passwords.verify).toHaveBeenCalledWith('senha-atual', 'hash-atual');
    expect(repository.updatePasswordHash).toHaveBeenCalledWith(1, 'hash-novo');
    expect(sessions.revokeAllSessions).toHaveBeenCalledWith(1, 'password');
  });

  it('recusa senha atual incorreta sem alterar nada', async () => {
    const { service, repository, sessions } = setup();

    await expect(
      service.changePassword(1, { ...input, currentPassword: 'errada' }),
    ).rejects.toThrow(UnauthorizedError);
    expect(repository.updatePasswordHash).not.toHaveBeenCalled();
    expect(sessions.revokeAllSessions).not.toHaveBeenCalled();
  });

  it('lança NotFoundError quando o usuário não existe mais', async () => {
    const { service } = setup({ findPasswordHash: vi.fn(async () => null) });

    await expect(service.changePassword(1, input)).rejects.toThrow(
      NotFoundError,
    );
  });

  it('propaga falha de infraestrutura sem revogar sessões', async () => {
    const { service, sessions } = setup({
      updatePasswordHash: vi.fn(async () => {
        throw new Error('banco indisponível');
      }),
    });

    await expect(service.changePassword(1, input)).rejects.toThrow(
      'banco indisponível',
    );
    expect(sessions.revokeAllSessions).not.toHaveBeenCalled();
  });
});

describe('UserServiceImpl.updateMyProfile', () => {
  it('usa o username também como slug e não envia campos ausentes', async () => {
    const { service, repository } = setup();

    await service.updateMyProfile(1, { username: 'bia' });

    expect(repository.updateProfile).toHaveBeenCalledWith(1, {
      username: 'bia',
      slugUrl: 'bia',
    });
  });

  it('repassa null para limpar bio e foto', async () => {
    const { service, repository } = setup();

    await service.updateMyProfile(1, { bio: null, urlPhoto: null });

    expect(repository.updateProfile).toHaveBeenCalledWith(1, {
      bio: null,
      urlPhoto: null,
    });
  });

  it('lança NotFoundError quando o perfil não existe', async () => {
    const { service } = setup({ updateProfile: vi.fn(async () => null) });

    await expect(service.updateMyProfile(1, { bio: 'x' })).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe('UserServiceImpl.findMyProfile', () => {
  it('lança NotFoundError quando o perfil não existe', async () => {
    const { service } = setup({ findProfileByUserId: vi.fn(async () => null) });

    await expect(service.findMyProfile(1)).rejects.toThrow(NotFoundError);
  });
});
