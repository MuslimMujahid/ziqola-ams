/**
 * Standard success response DTO for basic responses
 */
export class SuccessResponseDto<T = any> {
  message: string;
  statusCode: number;
  success: boolean;
  data: T;

  constructor(data: T, message = "Success", statusCode = 200) {
    this.message = message;
    this.statusCode = statusCode;
    this.success = true;
    this.data = data;
  }
}

/**
 * Metadata for paginated responses
 */
export interface PaginationMetaQuery {
  offset?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export class PaginationMeta {
  offset: number;
  limit: number;
  sort: string;
  order: string;

  constructor(query?: PaginationMetaQuery) {
    this.offset = query?.offset ?? 0;
    this.limit = query?.limit ?? 10;
    this.sort = query?.sort ?? "createdAt";
    this.order = query?.order ?? "desc";
  }
}

/**
 * Standard success response DTO for array/paginated responses
 */
export class PaginatedResponseDto<T = any> {
  message: string;
  statusCode: number;
  success: boolean;
  data: T[];
  meta: PaginationMeta;

  constructor(
    data: T[],
    meta: PaginationMeta,
    message = "Success",
    statusCode = 200
  ) {
    this.message = message;
    this.statusCode = statusCode;
    this.success = true;
    this.data = data;
    this.meta = meta;
  }
}
