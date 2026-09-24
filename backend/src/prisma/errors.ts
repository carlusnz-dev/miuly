// SQLSTATE `unique_violation`. O driver do Prisma normaliza o código em
// `sqlState`; a cadeia de `cause` é percorrida porque a violação pode chegar
// embrulhada por camadas do runtime.
const UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (typeof current !== 'object') {
      return false;
    }

    const candidate = current as {
      sqlState?: unknown;
      code?: unknown;
      cause?: unknown;
    };

    if (
      candidate.sqlState === UNIQUE_VIOLATION ||
      candidate.code === UNIQUE_VIOLATION
    ) {
      return true;
    }

    current = candidate.cause;
  }

  return false;
}
