import * as z from 'zod';
import type { Page } from '../types/pagination';
import type { PaginationMeta } from '../types/response';

export const MAX_PAGE_SIZE = 100;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
});

export function toPaginationMeta<T>(page: Page<T>): PaginationMeta {
  return {
    page: page.page,
    pageSize: page.pageSize,
    totalItems: page.total,
    totalPages: page.total === 0 ? 0 : Math.ceil(page.total / page.pageSize),
  };
}
