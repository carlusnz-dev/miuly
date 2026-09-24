import { describe, expect, it } from 'vitest';
import { varchar } from './varchar';

describe('varchar', () => {
  it('aceita valores dentro do limite', () => {
    expect(varchar('ana', 3)).toBe('ana');
  });

  it('rejeita valores acima do limite', () => {
    expect(() => varchar('anas', 3)).toThrow('Valor excede VarChar(3)');
  });
});
