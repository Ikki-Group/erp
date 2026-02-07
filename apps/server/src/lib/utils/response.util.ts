import type { WithPaginationResult } from './pagination.util'

/**
 * Response Helpers
 * Utility functions for creating standardized API responses
 */

/**
 * Standard success response
 * @example
 * return res.ok(user)
 * // { success: true, code: 'OK', data: user }
 */
export const res = {
  /**
   * Success response with data
   */
  ok: <T>(data: T, code = 'OK') => ({
    success: true as const,
    code,
    data,
  }),

  /**
   * Paginated success response
   */
  paginated: <T>(result: WithPaginationResult<T>, code = 'OK') => ({
    success: true as const,
    code,
    data: result.data,
    meta: result.meta,
  }),

  /**
   * Created response (201)
   */
  created: <T>(data: T, code = 'CREATED') => ({
    success: true as const,
    code,
    data,
  }),

  /**
   * No content response (204)
   */
  noContent: (): void => undefined,
}
