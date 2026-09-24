export interface SuccessResponse<T> {
  ok: true;
  message: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: PaginationMeta;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ErrorResponse {
  ok: false;
  message: string;
  issues?: ValidationIssue[];
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
