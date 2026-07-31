import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as typesRepo from '../src/repositories/types.repository.js';
import * as userRepo from '../src/repositories/user.repository.js';
import {
  createTypeService,
  findTypeByIdService,
} from '../src/services/types.service.js';

vi.mock('../src/repositories/types.repository.js');
vi.mock('../src/repositories/user.repository.js');

const tipoSalvo = {
  id: 1,
  name: 'Alimentação',
  applies_to: ['FINANCES', 'TASK'],
  user_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('createTypeService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando o usuário não existe', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue(null);

    const r = await createTypeService(
      { name: 'Alimentação', applies_to: ['FINANCES'] },
      999,
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(typesRepo.createType).not.toHaveBeenCalled();
  });

  it('cria o tipo vinculado ao usuário logado', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.createType).mockResolvedValue(tipoSalvo as any);

    const r = await createTypeService(
      { name: 'Alimentação', applies_to: ['FINANCES', 'TASK'] },
      1,
    );

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).not.toHaveProperty('user_id');
    expect(typesRepo.createType).toHaveBeenCalledWith(
      { name: 'Alimentação', applies_to: ['FINANCES', 'TASK'] },
      1,
    );
  });

  it('devolve error quando o nome já existe para o usuário', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.createType).mockRejectedValue(
      new Error('Unique constraint failed'),
    );

    const r = await createTypeService(
      { name: 'Alimentação', applies_to: ['FINANCES'] },
      1,
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
  });

  it.todo('deveria devolver conflict, não error, ao violar @@unique');
});

describe('findTypeByIdService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando o tipo é de outro usuário', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 2 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(null);

    const r = await findTypeByIdService(1, 2);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(typesRepo.findTypeById).toHaveBeenCalledWith(1, 2);
  });

  it('não expõe o user_id na resposta (ADR-0007)', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(tipoSalvo as any);

    const r = await findTypeByIdService(1, 1);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).not.toHaveProperty('user_id');
      expect(r.data.applies_to).toEqual(['FINANCES', 'TASK']);
    }
  });

  it('devolve error em vez de derrubar o processo quando o banco falha', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockRejectedValue(new Error('42846'));

    const r = await findTypeByIdService(1, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
  });
});
