export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'conflict' | 'error'; message: string };
