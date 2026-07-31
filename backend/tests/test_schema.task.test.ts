import { describe, it, expect } from 'vitest';
import { createTaskSchema, updateTaskSchema } from '../src/types/task.type.js';

const valida = {
  name: 'Estudar Angular',
  description: 'Ler a documentação de components',
  type_id: 1,
  due_date: '2026-08-10T12:00:00.000Z',
};

describe('createTaskSchema', () => {
  it('aceita uma tarefa mínima sem priority nem sync', () => {
    const r = createTaskSchema.safeParse(valida);

    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty('priority');
    expect(r.data).not.toHaveProperty('sync');
  });

  it('converte due_date de string ISO para Date', () => {
    const r = createTaskSchema.safeParse(valida);

    expect(r.success).toBe(true);
    expect(r.data?.due_date).toBeInstanceOf(Date);
  });

  it('rejeita due_date que não é uma data', () => {
    const r = createTaskSchema.safeParse({ ...valida, due_date: 'ontem' });

    expect(r.success).toBe(false);
  });

  it('rejeita priority fora do enum', () => {
    const r = createTaskSchema.safeParse({ ...valida, priority: 'URGENTISSIMO' });

    expect(r.success).toBe(false);
  });

  it('rejeita name com menos de 3 caracteres', () => {
    const r = createTaskSchema.safeParse({ ...valida, name: 'ab' });

    expect(r.success).toBe(false);
  });

  it('descarta campos não declarados', () => {
    const r = createTaskSchema.safeParse({ ...valida, user_id: 42 });

    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty('user_id');
  });
});

describe('updateTaskSchema', () => {
  it('aceita alteração de um único campo', () => {
    const r = updateTaskSchema.safeParse({ name: 'Outro nome' });

    expect(r.success).toBe(true);
  });

  it('aceita corpo vazio — mesmo gap do updateFinanceSchema', () => {
    const r = updateTaskSchema.safeParse({});

    expect(r.success).toBe(true);
  });

  it.todo('deveria rejeitar corpo vazio com .refine()');
});
