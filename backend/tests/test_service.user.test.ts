import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as repo from '../src/repositories/user.repository.js';
import { updateUserService } from '../src/services/user.service.js';

vi.mock('../src/repositories/user.repository.js');

describe('updateUserService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando o usuário não existe', async () => {
    vi.mocked(repo.findUserById).mockResolvedValue(null);
    const r = await updateUserService({ username: 'x' }, 999);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
  });

  it('não conflita ao manter o mesmo e-mail', async () => {
    vi.mocked(repo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(repo.findUserByEmailOrUsername).mockResolvedValue(null);
    vi.mocked(repo.updateUser).mockResolvedValue({
      id: 1,
      username: 'novo',
    } as any);

    const r = await updateUserService({ username: 'novo' }, 1);
    expect(r.ok).toBe(true);
  });
});
