import { describe, expect, it } from 'vitest';
import {
  toDate,
  toInstant,
  toNullableDate,
  toNullableInstant,
} from './instant';

describe('conversão entre Date e Temporal.Instant', () => {
  const iso = '2026-09-24T12:34:56.789Z';

  it('preserva o instante nos dois sentidos', () => {
    const instant = toInstant(new Date(iso));

    expect(instant.toString()).toBe(iso);
    expect(toDate(instant).toISOString()).toBe(iso);
  });

  it('preserva null e undefined', () => {
    expect(toNullableDate(null)).toBeNull();
    expect(toNullableInstant(null)).toBeNull();
    expect(toNullableInstant(undefined)).toBeUndefined();
  });
});
