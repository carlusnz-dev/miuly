import { describe, expect, it } from 'vitest';
import {
  endNotBeforeStart,
  hasAnyField,
  isoInstantSchema,
  peoplesSchema,
  uuidParamsSchema,
} from './schemas';

describe('uuidParamsSchema', () => {
  it('aceita UUID', () => {
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e';

    expect(uuidParamsSchema.parse({ id })).toEqual({ id });
  });

  it.each(['1', 'abc', ''])('rejeita "%s"', (id) => {
    expect(uuidParamsSchema.safeParse({ id }).success).toBe(false);
  });
});

describe('isoInstantSchema', () => {
  it.each([
    ['2026-09-24T13:00:00Z', '2026-09-24T13:00:00.000Z'],
    ['2026-09-24T10:00:00-03:00', '2026-09-24T13:00:00.000Z'],
  ])('converte "%s" para Date', (input, expected) => {
    expect(isoInstantSchema.parse(input).toISOString()).toBe(expected);
  });

  it.each(['2026-09-24', '2026-09-24T10:00:00', 'amanhã'])(
    'rejeita "%s" sem instante e fuso',
    (input) => {
      expect(isoInstantSchema.safeParse(input).success).toBe(false);
    },
  );
});

describe('peoplesSchema', () => {
  it('remove espaços das pontas', () => {
    expect(peoplesSchema.parse([' Ana '])).toEqual(['Ana']);
  });

  it('rejeita nome vazio e listas acima de 50', () => {
    expect(peoplesSchema.safeParse(['  ']).success).toBe(false);
    expect(peoplesSchema.safeParse(Array(51).fill('Ana')).success).toBe(false);
  });
});

describe('hasAnyField', () => {
  it('ignora campos ausentes, mas aceita null', () => {
    expect(hasAnyField({})).toBe(false);
    expect(hasAnyField({ bio: undefined })).toBe(false);
    expect(hasAnyField({ bio: null })).toBe(true);
  });
});

describe('endNotBeforeStart', () => {
  const start = new Date('2026-09-24T10:00:00Z');
  const end = new Date('2026-09-24T11:00:00Z');

  it('aceita término igual ou posterior ao início', () => {
    expect(endNotBeforeStart({ startTime: start, endTime: end })).toBe(true);
    expect(endNotBeforeStart({ startTime: start, endTime: start })).toBe(true);
  });

  it('rejeita término anterior ao início', () => {
    expect(endNotBeforeStart({ startTime: end, endTime: start })).toBe(false);
  });

  it('não compara quando falta um dos extremos', () => {
    expect(endNotBeforeStart({ endTime: start })).toBe(true);
    expect(endNotBeforeStart({ startTime: end, endTime: null })).toBe(true);
  });
});
