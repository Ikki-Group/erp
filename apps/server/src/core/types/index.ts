/**
 * Common TypeScript types shared across the application
 */

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Base entity with common timestamps
 */
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Soft-deletable entity
 */
export interface SoftDeletable {
  deletedAt: Date | null
}

/**
 * Generic service result type
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * JWT payload structure
 */
export interface JwtPayload {
  sub: string // user id
  email: string
  iat: number
  exp: number
}

/**
 * Authenticated user context
 */
export interface AuthUser {
  id: string
  email: string
}
