export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface Page<T> extends PageRequest {
  items: T[];
  total: number;
}
