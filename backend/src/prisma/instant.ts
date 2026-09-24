// O codec pg/timestamptz-temporal@1 lê e grava Temporal.Instant. As entidades
// do domínio usam Date; a conversão fica restrita aos adaptadores Prisma.
export interface InstantLike {
  epochMilliseconds: number;
}

export function toDate(value: InstantLike): Date {
  return new Date(value.epochMilliseconds);
}

export function toNullableDate(value: InstantLike | null): Date | null {
  return value === null ? null : toDate(value);
}

export function toInstant(date: Date): Temporal.Instant {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime());
}

export function toNullableInstant(
  date: Date | null | undefined,
): Temporal.Instant | null | undefined {
  if (date === undefined || date === null) {
    return date;
  }

  return toInstant(date);
}
