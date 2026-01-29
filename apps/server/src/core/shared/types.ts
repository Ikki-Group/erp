/**
 * Shared types used across the application
 */

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Pagination metadata returned in list responses
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Standard API success response
 */
export interface ApiResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    statusCode: number
    details?: Record<string, unknown>
  }
}

/**
 * Filter operators for query parameters
 */
export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "in"

/**
 * Sort order
 */
export type SortOrder = "asc" | "desc"

/**
 * Sort parameters
 */
export interface SortParams {
  field: string
  order: SortOrder
}

/**
 * Timestamp fields common to most entities
 */
export interface Timestamps {
  createdAt: Date
  updatedAt: Date
}

/**
 * Soft delete fields
 */
export interface SoftDelete {
  isDeleted: boolean
  deletedAt: Date | null
}

/**
 * Base entity with ID and timestamps
 */
export interface BaseEntity extends Timestamps {
  id: string
}
