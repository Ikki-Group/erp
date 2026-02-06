/**
 * Shared Response Types
 * Standardized response structures for API endpoints
 */

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number
  /** Number of items per page */
  limit: number
  /** Total number of items */
  total: number
  /** Total number of pages */
  totalPages: number
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of data items */
  data: T[]
  /** Pagination metadata */
  meta: PaginationMeta
}

/**
 * Success response wrapper
 */
export interface SuccessResponse<T> {
  /** Success indicator */
  success: true
  /** Response code */
  code: string
  /** Response data */
  data: T
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  /** Success indicator */
  success: false
  /** Error code */
  code: string
  /** Error message */
  message: string
  /** Additional error details */
  details?: Record<string, unknown>
  /** Stack trace (development only) */
  stack?: string
}
