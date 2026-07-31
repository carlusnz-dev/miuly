import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as financesRepo from '../src/repositories/finances.repository.js';
import * as taskRepo from '../src/repositories/task.repository.js';
import * as typesRepo from '../src/repositories/types.repository.js';
import * as userRepo from '../src/repositories/user.repository.js';
import {
  createTypeService,
  deleteTypeService,
  findAllTypesByUserIdService,
  findTypeByIdService,
  updateTypeService,
} from '../src/services/types.service.js';

vi.mock('../src/repositories/finances.repository.js');
vi.mock('../src/repositories/task.repository.js');
vi.mock('../src/repositories/types.repository.js');
vi.mock('../src/repositories/user.repository.js');

// O Prisma sinaliza violação de constraint pelo campo `code` do erro.
const erroPrisma = (code: string) => Object.assign(new Error(code), { code });

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

  it('devolve conflict quando o nome já existe para o usuário (P2002)', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.createType).mockRejectedValue(erroPrisma('P2002'));

    const r = await createTypeService(
      { name: 'Alimentação', applies_to: ['FINANCES'] },
      1,
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('conflict');
  });

  it('devolve error para falha de banco que não é de constraint', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.createType).mockRejectedValue(new Error('boom'));

    const r = await createTypeService(
      { name: 'Alimentação', applies_to: ['FINANCES'] },
      1,
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
  });
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

describe('findAllTypesByUserIdService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando o usuário não tem tipos', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findAllTypesByUserId).mockResolvedValue([]);

    const r = await findAllTypesByUserIdService(1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
  });

  it('consulta o repositório filtrando pelo usuário logado', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findAllTypesByUserId).mockResolvedValue([
      tipoSalvo,
    ] as any);

    const r = await findAllTypesByUserIdService(1);

    expect(r.ok).toBe(true);
    expect(typesRepo.findAllTypesByUserId).toHaveBeenCalledWith(1);
  });
});

describe('updateTypeService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando o tipo é de outro usuário', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 2 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(null);

    const r = await updateTypeService(1, 2, { name: 'Invadindo' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(typesRepo.findTypeById).toHaveBeenCalledWith(1, 2);
    expect(typesRepo.updateType).not.toHaveBeenCalled();
  });

  it('envia ao repositório apenas os campos presentes no corpo', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(tipoSalvo as any);
    vi.mocked(typesRepo.updateType).mockResolvedValue(tipoSalvo as any);

    await updateTypeService(1, 1, { name: 'Mercado' });

    expect(typesRepo.updateType).toHaveBeenCalledWith(1, 1, {
      name: 'Mercado',
    });
  });

  it('devolve conflict ao colidir com o nome de outro tipo (P2002)', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(tipoSalvo as any);
    vi.mocked(typesRepo.updateType).mockRejectedValue(erroPrisma('P2002'));

    const r = await updateTypeService(1, 1, { name: 'Já existe' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('conflict');
  });
});

describe('deleteTypeService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando o tipo é de outro usuário', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 2 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(null);

    const r = await deleteTypeService(1, 2);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(typesRepo.deleteType).not.toHaveBeenCalled();
  });

  it('recusa com conflict quando o tipo está em uso por finanças', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(tipoSalvo as any);
    vi.mocked(financesRepo.countFinancesByTypeId).mockResolvedValue(3);
    vi.mocked(taskRepo.countTasksByTypeId).mockResolvedValue(0);

    const r = await deleteTypeService(1, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe('conflict');
      expect(r.message).toContain('3');
    }
    expect(typesRepo.deleteType).not.toHaveBeenCalled();
  });

  it('recusa com conflict quando o tipo está em uso por tarefas', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(tipoSalvo as any);
    vi.mocked(financesRepo.countFinancesByTypeId).mockResolvedValue(0);
    vi.mocked(taskRepo.countTasksByTypeId).mockResolvedValue(2);

    const r = await deleteTypeService(1, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('conflict');
    expect(typesRepo.deleteType).not.toHaveBeenCalled();
  });

  it('deleta quando o tipo não está em uso', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(tipoSalvo as any);
    vi.mocked(financesRepo.countFinancesByTypeId).mockResolvedValue(0);
    vi.mocked(taskRepo.countTasksByTypeId).mockResolvedValue(0);
    vi.mocked(typesRepo.deleteType).mockResolvedValue(tipoSalvo as any);

    const r = await deleteTypeService(1, 1);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).not.toHaveProperty('user_id');
    expect(typesRepo.deleteType).toHaveBeenCalledWith(1, 1);
  });

  it('devolve conflict se a FK Restrict barrar no banco (P2003)', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(tipoSalvo as any);
    vi.mocked(financesRepo.countFinancesByTypeId).mockResolvedValue(0);
    vi.mocked(taskRepo.countTasksByTypeId).mockResolvedValue(0);
    vi.mocked(typesRepo.deleteType).mockRejectedValue(erroPrisma('P2003'));

    const r = await deleteTypeService(1, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('conflict');
  });
});
