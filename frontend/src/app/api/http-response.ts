/** Envelope de sucesso publicado pelo backend em core/types/response.ts. */
export interface ApiSuccess<T> {
  ok: true;
  message: string;
  data: T;
}
