import { describe, it, expect } from 'vitest';
import {
  createFinanceSchema,
  financeParamsSchema,
  updateFinanceSchema,
} from '../src/types/finances.type.js';

describe('createFinanceSchema', () => {
  it('descarta campos não declarados', () => {
    const r = createFinanceSchema.safeParse({
      name: 'Mercado',
      description: 'Compra do mês',
      value: 250.5,
      type_id: 1,
      bank_id: 1,
      user_id: 42,
    });

    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty('user_id');
  });
});

describe('updateFinanceSchema', () => {
  it('aceita alteração de um único campo', () => {
    const r = updateFinanceSchema.safeParse({ value: 99 });

    expect(r.success).toBe(true);
  });

  it('rejeita corpo vazio', () => {
    const r = updateFinanceSchema.safeParse({});

    expect(r.success).toBe(false);
  });
});

describe('financeParamsSchema', () => {
  it('converte o id da URL de string para number', () => {
    const r = financeParamsSchema.safeParse({ id: '5' });

    expect(r.success).toBe(true);
    expect(r.data?.id).toBe(5);
  });

  it('rejeita id não numérico', () => {
    const r = financeParamsSchema.safeParse({ id: 'abc' });

    expect(r.success).toBe(false);
  });

  it('rejeita id negativo ou zero', () => {
    expect(financeParamsSchema.safeParse({ id: '-1' }).success).toBe(false);
    expect(financeParamsSchema.safeParse({ id: '0' }).success).toBe(false);
  });

  it('rejeita id decimal', () => {
    const r = financeParamsSchema.safeParse({ id: '1.5' });

    expect(r.success).toBe(false);
  });
});
