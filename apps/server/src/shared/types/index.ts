/**
 * Common TypeScript type definitions
 */

/**
 * UUID string type
 */
export type ID = string

/**
 * ISO 8601 timestamp
 */
export type Timestamp = Date

/**
 * Generic paginated result type
 */
export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
