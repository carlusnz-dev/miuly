import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../core/error';
import { makeUser } from './fixtures';
import type { UserRepository } from './repository';
import { UserService } from './service';

function fakeRepository(
  result: Awaited<ReturnType<UserRepository['findById']>>,
) {
  return { findById: vi.fn(async () => result) } satisfies UserRepository;
}

describe('UserService.findById', () => {
  it('retorna o usuário encontrado', async () => {
    const user = makeUser({ id: 5 });
    const repository = fakeRepository(user);

    await expect(new UserService(repository).findById(5)).resolves.toBe(user);
    expect(repository.findById).toHaveBeenCalledWith(5);
  });

  it('lança NotFoundError quando o usuário não existe', async () => {
    const service = new UserService(fakeRepository(null));

    await expect(service.findById(5)).rejects.toThrow(NotFoundError);
    await expect(service.findById(5)).rejects.toThrow('Usuário não encontrado');
  });
});
