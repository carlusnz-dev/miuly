import { describe, expect, it } from 'vitest';
import { isUniqueViolation } from './errors';

describe('isUniqueViolation', () => {
  it('reconhece o SQLSTATE 23505 no erro ou na causa', () => {
    expect(isUniqueViolation({ sqlState: '23505' })).toBe(true);
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
    expect(
      isUniqueViolation(new Error('x', { cause: { sqlState: '23505' } })),
    ).toBe(true);
  });

  it('ignora outros erros', () => {
    expect(isUniqueViolation({ sqlState: '23503' })).toBe(false);
    expect(isUniqueViolation(new Error('x'))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation('23505')).toBe(false);
  });
});
