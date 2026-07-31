import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as taskRepo from '../src/repositories/task.repository.js';
import * as typesRepo from '../src/repositories/types.repository.js';
import * as userRepo from '../src/repositories/user.repository.js';
import {
  createTaskService,
  deleteTaskService,
  findAllTasksByUserIdService,
  findTaskByIdService,
  updateTaskService,
} from '../src/services/task.service.js';

vi.mock('../src/repositories/task.repository.js');
vi.mock('../src/repositories/types.repository.js');
vi.mock('../src/repositories/user.repository.js');

const entrada = {
  name: 'Estudar Angular',
  description: 'Ler a documentação de components',
  type_id: 1,
  due_date: new Date('2026-08-10T12:00:00.000Z'),
};

const tarefaSalva = {
  id: 10n,
  name: entrada.name,
  description: entrada.description,
  priority: 'MEDIUM',
  type_id: 1,
  sync: false,
  due_date: entrada.due_date,
  user_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('createTaskService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando o usuário não existe', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue(null);

    const r = await createTaskService(entrada, 999);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(taskRepo.createTask).not.toHaveBeenCalled();
  });

  it('retorna not_found quando o tipo não pertence ao usuário', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue(null);

    const r = await createTaskService(entrada, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(typesRepo.findTypeById).toHaveBeenCalledWith(1, 1);
    expect(taskRepo.createTask).not.toHaveBeenCalled();
  });

  it('recusa tipo que não contém TASK em applies_to', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue({
      id: 1,
      user_id: 1,
      applies_to: ['FINANCES'],
    } as any);

    const r = await createTaskService(entrada, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
    expect(taskRepo.createTask).not.toHaveBeenCalled();
  });

  it('cria a tarefa e devolve o id BigInt serializado como number', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue({
      id: 1,
      user_id: 1,
      applies_to: ['TASK'],
    } as any);
    vi.mocked(taskRepo.createTask).mockResolvedValue(tarefaSalva as any);

    const r = await createTaskService(entrada, 1);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.id).toBe(10);
      expect(typeof r.data.id).toBe('number');
      expect(() => JSON.stringify(r.data)).not.toThrow();
    }
  });

  it('não envia priority nem sync ao repositório quando ausentes', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue({
      id: 1,
      user_id: 1,
      applies_to: ['TASK'],
    } as any);
    vi.mocked(taskRepo.createTask).mockResolvedValue(tarefaSalva as any);

    await createTaskService(entrada, 1);

    expect(taskRepo.createTask).toHaveBeenCalledWith(
      {
        name: entrada.name,
        description: entrada.description,
        type_id: entrada.type_id,
        due_date: entrada.due_date,
      },
      1,
    );
  });

  it('devolve error em vez de propagar quando o repositório falha', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue({
      id: 1,
      user_id: 1,
      applies_to: ['TASK'],
    } as any);
    vi.mocked(taskRepo.createTask).mockRejectedValue(new Error('42846'));

    const r = await createTaskService(entrada, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
  });
});

describe('updateTaskService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando a tarefa não é do usuário logado', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 2 } as any);
    vi.mocked(taskRepo.findTaskById).mockResolvedValue(null);

    const r = await updateTaskService(10, 2, { name: 'Invadindo' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(taskRepo.findTaskById).toHaveBeenCalledWith(10, 2);
    expect(taskRepo.updateTask).not.toHaveBeenCalled();
  });

  it('não valida o tipo quando type_id não vem no corpo', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(taskRepo.findTaskById).mockResolvedValue(tarefaSalva as any);
    vi.mocked(taskRepo.updateTask).mockResolvedValue(tarefaSalva as any);

    const r = await updateTaskService(10, 1, { name: 'Novo nome' });

    expect(r.ok).toBe(true);
    expect(typesRepo.findTypeById).not.toHaveBeenCalled();
  });

  it('envia ao repositório apenas os campos presentes no corpo', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(taskRepo.findTaskById).mockResolvedValue(tarefaSalva as any);
    vi.mocked(taskRepo.updateTask).mockResolvedValue(tarefaSalva as any);

    await updateTaskService(10, 1, { name: 'Novo nome' });

    expect(taskRepo.updateTask).toHaveBeenCalledWith(10, 1, {
      name: 'Novo nome',
    });
  });

  it('recusa troca para um tipo que não contém TASK', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(taskRepo.findTaskById).mockResolvedValue(tarefaSalva as any);
    vi.mocked(typesRepo.findTypeById).mockResolvedValue({
      id: 7,
      user_id: 1,
      applies_to: ['FINANCES'],
    } as any);

    const r = await updateTaskService(10, 1, { type_id: 7 });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
    expect(taskRepo.updateTask).not.toHaveBeenCalled();
  });
});

describe('deleteTaskService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando a tarefa não é do usuário logado', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 2 } as any);
    vi.mocked(taskRepo.findTaskById).mockResolvedValue(null);

    const r = await deleteTaskService(10, 2);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
    expect(taskRepo.deleteTask).not.toHaveBeenCalled();
  });

  it('devolve error em vez de derrubar o processo quando o banco falha', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(taskRepo.findTaskById).mockRejectedValue(new Error('boom'));

    const r = await deleteTaskService(10, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
  });

  it('deleta e devolve o id serializado', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(taskRepo.findTaskById).mockResolvedValue(tarefaSalva as any);
    vi.mocked(taskRepo.deleteTask).mockResolvedValue(tarefaSalva as any);

    const r = await deleteTaskService(10, 1);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.id).toBe(10);
  });
});

describe('findTaskByIdService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('não expõe o user_id na resposta (ADR-0007)', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(taskRepo.findTaskById).mockResolvedValue(tarefaSalva as any);

    const r = await findTaskByIdService(10, 1);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).not.toHaveProperty('user_id');
      expect(r.data.id).toBe(10);
    }
  });

  it('retorna not_found quando a tarefa é de outro usuário', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 2 } as any);
    vi.mocked(taskRepo.findTaskById).mockResolvedValue(null);

    const r = await findTaskByIdService(10, 2);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
  });
});

describe('findAllTasksByUserIdService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retorna not_found quando o usuário não tem tarefas', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(taskRepo.findAllTasksByUserId).mockResolvedValue([]);

    const r = await findAllTasksByUserIdService(1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
  });

  it('serializa o id de todas as tarefas da lista', async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(taskRepo.findAllTasksByUserId).mockResolvedValue([
      { ...tarefaSalva, id: 1n },
      { ...tarefaSalva, id: 2n },
    ] as any);

    const r = await findAllTasksByUserIdService(1);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.map((t) => t.id)).toEqual([1, 2]);
      expect(() => JSON.stringify(r.data)).not.toThrow();
    }
  });
});
