import type {
  ApiResponse,
  ApiErrorResponse,
  PaginatedResponse,
  PaginationMeta,
} from "./types"

/**
 * DTO utilities for standardized API responses
 */

/**
 * Create a success response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  }
}

/**
 * Create a paginated success response
 */
export function paginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
): ApiResponse<PaginatedResponse<T>> {
  return {
    success: true,
    data: {
      data,
      meta,
    },
  }
}

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>,
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      statusCode,
      ...(details && { details }),
    },
  }
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}
