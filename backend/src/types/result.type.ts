export type ServiceResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      reason: 'conflict' | 'error' | 'not_found' | 'unauthorized';
      message: string;
    };

export type ServiceNoDataResult<T, D> =
  | { ok: true; message: T; data?: D }
  | {
      ok: false;
      reason: 'conflict' | 'error' | 'not_found' | 'unauthorized';
      message: string;
    };

export type LoginServiceResult<T, D> =
  | { ok: true; message: T; data: D }
  | {
      ok: false;
      reason: 'conflict' | 'error' | 'not_found' | 'unauthorized';
      message: string;
    };
