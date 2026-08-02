export type ApiOk<T> = { ok: true; data: T };
export type ApiMsg = { ok: true; message: string };
export type ApiFail = {
  ok: false;
  reason: 'conflict' | 'error' | 'not_found' | 'unauthorized' | 'invalid';
  message: string;
};
