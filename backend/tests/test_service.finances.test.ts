import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bankRepo from '../src/repositories/bank.repository.js';
import * as financesRepo from '../src/repositories/finances.repository.js';
import * as typesRepo from '../src/repositories/types.repository.js';
import * as userRepo from '../src/repositories/user.repository.js';
import {
  createFinancesService,
  deleteFinanceService,
  findAllFinancesByUserIdService,
  updateFinanceService,
} from '../src/services/finances.service.js';

vi.mock('../src/repositories/bank.repository.js');
vi.mock('../src/repositories/finances.repository.js');
vi.mock('../src/repositories/types.repository.js');
vi.mock('../src/repositories/user.repository.js');

const entrada = {
  name: 'Mercado',
  description: 'Compra do mês',
  value: 250.5,
  type_id: 1,
  bank_id: 1,
};

const financaSalva = {
  id: 5,
  ...entrada,
  user_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
};

const tipoValido = { id: 1, user_id: 1, applies_to: ['FINANCES'] };

describe('createFinancesService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando o usuário não existe', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue(null);

    const r = await createFinancesService(entrada, 999);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(financesRepo.createFinance).not.toHaveBeenCalled();
  });

  it('retorna not_found quando o banco não existe', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bankRepo.findBankById).mockResolvedValue(null);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(tipoValido as any);

    const r = await createFinancesService(entrada, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(financesRepo.createFinance).not.toHaveBeenCalled();
  });

  it('retorna not_found quando o tipo não pertence ao usuário', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bankRepo.findBankById).mockResolvedValue({
      id: 1,
      user_id: 1,
    } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(null);

    const r = await createFinancesService(entrada, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
  });

  it('recusa tipo que não contém FINANCES em applies_to', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bankRepo.findBankById).mockResolvedValue({
      id: 1,
      user_id: 1,
    } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue({
      id: 1,
      user_id: 1,
      applies_to: ['TASK'],
    } as any);

    const r = await createFinancesService(entrada, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
    expect(financesRepo.createFinance).not.toHaveBeenCalled();
  });

  it('cria a finança quando usuário, banco e tipo são válidos', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bankRepo.findBankById).mockResolvedValue({
      id: 1,
      user_id: 1,
    } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(tipoValido as any);
    vi.mocked(financesRepo.createFinance).mockResolvedValue(
      financaSalva as any,
    );

    const r = await createFinancesService(entrada, 1);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).not.toHaveProperty('user_id');
  });

  it('devolve error em vez de propagar quando o repositório falha', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bankRepo.findBankById).mockResolvedValue({
      id: 1,
      user_id: 1,
    } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(tipoValido as any);
    vi.mocked(financesRepo.createFinance).mockRejectedValue(new Error('boom'));

    const r = await createFinancesService(entrada, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
  });

  it('recusa bank_id que pertence a outro usuário', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bankRepo.findBankById).mockResolvedValue({
      id: 1,
      user_id: 2,
    } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(tipoValido as any);

    const r = await createFinancesService(entrada, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(financesRepo.createFinance).not.toHaveBeenCalled();
  });
});

describe('updateFinanceService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando a finança não é do usuário logado', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 2 } as any);
    vi.mocked(financesRepo.findFinanceById).mockResolvedValue(null);

    const r = await updateFinanceService(5, 2, { name: 'Invadindo' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(financesRepo.findFinanceById).toHaveBeenCalledWith(5, 2);
    expect(financesRepo.updateFinance).not.toHaveBeenCalled();
  });

  it('não valida banco nem tipo quando eles não vêm no corpo', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(financesRepo.findFinanceById).mockResolvedValue(
      financaSalva as any,
    );
    vi.mocked(financesRepo.updateFinance).mockResolvedValue(
      financaSalva as any,
    );

    const r = await updateFinanceService(5, 1, { name: 'Mercado novo' });

    expect(r.ok).toBe(true);
    expect(bankRepo.findBankById).not.toHaveBeenCalled();
    expect(typesRepo.findTypeById).not.toHaveBeenCalled();
  });

  it('envia ao repositório apenas os campos presentes no corpo', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(financesRepo.findFinanceById).mockResolvedValue(
      financaSalva as any,
    );
    vi.mocked(financesRepo.updateFinance).mockResolvedValue(
      financaSalva as any,
    );

    await updateFinanceService(5, 1, { value: 99 });

    expect(financesRepo.updateFinance).toHaveBeenCalledWith(5, 1, {
      value: 99,
    });
  });

  it('recusa troca para um tipo que não contém FINANCES', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(financesRepo.findFinanceById).mockResolvedValue(
      financaSalva as any,
    );
    vi.mocked(typesRepo.findTypeById).mockResolvedValue({
      id: 7,
      user_id: 1,
      applies_to: ['TASK'],
    } as any);

    const r = await updateFinanceService(5, 1, { type_id: 7 });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
    expect(financesRepo.updateFinance).not.toHaveBeenCalled();
  });
});

describe('deleteFinanceService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando a finança não é do usuário logado', async () => {
    vi.mocked(financesRepo.findFinanceById).mockResolvedValue(null);
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 2 } as any);

    const r = await deleteFinanceService(5, 2);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(financesRepo.deleteFinance).not.toHaveBeenCalled();
  });

  it('deleta quando a finança pertence ao usuário', async () => {
    vi.mocked(financesRepo.findFinanceById).mockResolvedValue(
      financaSalva as any,
    );
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(financesRepo.deleteFinance).mockResolvedValue(
      financaSalva as any,
    );

    const r = await deleteFinanceService(5, 1);

    expect(r.ok).toBe(true);
    expect(financesRepo.deleteFinance).toHaveBeenCalledWith(5, 1);
  });

  it('devolve error em vez de derrubar o processo quando o banco falha', async () => {
    vi.mocked(financesRepo.findFinanceById).mockRejectedValue(
      new Error('boom'),
    );
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);

    const r = await deleteFinanceService(5, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
  });

  it('não expõe o user_id na resposta (ADR-0007)', async () => {
    vi.mocked(financesRepo.findFinanceById).mockResolvedValue(
      financaSalva as any,
    );
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(financesRepo.deleteFinance).mockResolvedValue(
      financaSalva as any,
    );

    const r = await deleteFinanceService(5, 1);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).not.toHaveProperty('user_id');
  });
});

describe('findAllFinancesByUserIdService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando o usuário não tem finanças', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(financesRepo.findAllFinancesByUserId).mockResolvedValue([]);

    const r = await findAllFinancesByUserIdService(1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
  });

  it('devolve error em vez de propagar quando o repositório falha', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(financesRepo.findAllFinancesByUserId).mockRejectedValue(
      new Error('boom'),
    );

    const r = await findAllFinancesByUserIdService(1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
  });
});
