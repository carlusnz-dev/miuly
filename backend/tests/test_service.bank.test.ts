import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bankRepo from '../src/repositories/bank.repository.js';
import * as userRepo from '../src/repositories/user.repository.js';
import {
  createBankService,
  deleteBankService,
  findAllBanksByUserIdService,
  findBankByIdService,
  updateBankService,
} from '../src/services/bank.service.js';

vi.mock('../src/repositories/bank.repository.js');
vi.mock('../src/repositories/user.repository.js');

const bancoDoUsuario1 = {
  id: 1,
  name: 'Nubank',
  balance: 100,
  user_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('createBankService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando o usuário não existe', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue(null);

    const r = await createBankService({ name: 'Nubank', balance: 0 }, 999);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(bankRepo.createBank).not.toHaveBeenCalled();
  });

  it('cria o banco vinculado ao usuário logado', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bankRepo.createBank).mockResolvedValue(bancoDoUsuario1 as any);

    const r = await createBankService({ name: 'Nubank', balance: 100 }, 1);

    expect(r.ok).toBe(true);
    expect(bankRepo.createBank).toHaveBeenCalledWith(
      { name: 'Nubank', balance: 100 },
      1,
    );
  });
});

describe('updateBankService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('recusa com unauthorized quando o banco é de outro usuário', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 2 } as any);
    vi.mocked(bankRepo.findBankById).mockResolvedValue(bancoDoUsuario1 as any);

    const r = await updateBankService({ name: 'Invadido' }, 1, 2);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unauthorized');
    expect(bankRepo.updateBank).not.toHaveBeenCalled();
  });

  it('preserva balance igual a zero na atualização', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bankRepo.findBankById).mockResolvedValue(bancoDoUsuario1 as any);
    vi.mocked(bankRepo.updateBank).mockResolvedValue({
      ...bancoDoUsuario1,
      balance: 0,
    } as any);

    const r = await updateBankService({ balance: 0 }, 1, 1);

    expect(r.ok).toBe(true);
    expect(bankRepo.updateBank).toHaveBeenCalledWith({ balance: 0 }, 1, 1);
  });

  it('devolve error quando o repositório falha na atualização', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bankRepo.findBankById).mockResolvedValue(bancoDoUsuario1 as any);
    vi.mocked(bankRepo.updateBank).mockRejectedValue(new Error('boom'));

    const r = await updateBankService({ name: 'Novo' }, 1, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
  });
});

describe('deleteBankService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('recusa com unauthorized quando o banco é de outro usuário', async () => {
    vi.mocked(bankRepo.findBankById).mockResolvedValue(bancoDoUsuario1 as any);
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 2 } as any);

    const r = await deleteBankService(1, 2);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unauthorized');
    expect(bankRepo.deleteBank).not.toHaveBeenCalled();
  });

  it('retorna not_found quando o banco não existe', async () => {
    vi.mocked(bankRepo.findBankById).mockResolvedValue(null);
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);

    const r = await deleteBankService(99, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
  });

  it('deleta quando o banco pertence ao usuário', async () => {
    vi.mocked(bankRepo.findBankById).mockResolvedValue(bancoDoUsuario1 as any);
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bankRepo.deleteBank).mockResolvedValue(bancoDoUsuario1 as any);

    const r = await deleteBankService(1, 1);

    expect(r.ok).toBe(true);
    expect(bankRepo.deleteBank).toHaveBeenCalledWith(1, 1);
  });
});

describe('findBankByIdService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('recusa com unauthorized quando o banco é de outro usuário', async () => {
    vi.mocked(bankRepo.findBankById).mockResolvedValue(bancoDoUsuario1 as any);

    const r = await findBankByIdService(1, 2);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unauthorized');
  });

  it('não expõe o user_id na resposta (ADR-0007)', async () => {
    vi.mocked(bankRepo.findBankById).mockResolvedValue(bancoDoUsuario1 as any);

    const r = await findBankByIdService(1, 1);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).not.toHaveProperty('user_id');
  });
});

describe('findAllBanksByUserIdService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando o usuário não tem bancos', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bankRepo.findAllBanksByUserId).mockResolvedValue([]);

    const r = await findAllBanksByUserIdService(1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
  });

  it('consulta o repositório filtrando pelo usuário logado', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bankRepo.findAllBanksByUserId).mockResolvedValue([
      bancoDoUsuario1,
    ] as any);

    const r = await findAllBanksByUserIdService(1);

    expect(r.ok).toBe(true);
    expect(bankRepo.findAllBanksByUserId).toHaveBeenCalledWith(1);
  });
});
