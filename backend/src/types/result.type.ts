export type ServiceResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      reason: 'conflict' | 'error' | 'not_found';
      message: string;
    };
