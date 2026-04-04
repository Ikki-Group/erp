import type { WithPaginationResult } from '../utils/pagination'

/**
 * Standard HTTP Response Wrapper.
 * Consistent with createSuccessResponseSchema and createPaginatedResponseSchema.
 */
export const res = {
  /**
   * 200 OK - Standard success with data.
   *
   * @param {T} data - The data payload to return.
   * @param {string} code - Optional success code.
   * @returns {object} The standard success response object.
   */
  ok: <T>(data: T, code = 'OK') => ({ success: true as const, code, data }),

  /**
   * 201 Created - Succesfull resource creation.
   *
   * @param {T} data - The created resource data.
   * @param {string} code - Optional success code.
   * @returns {object} The standard created response object.
   */
  created: <T>(data: T, code = 'CREATED') => ({ success: true as const, code, data }),

  /**
   * 200 OK - Standard paginated success.
   *
   * @param {WithPaginationResult<T>} result - The paginated result containing data and meta.
   * @param {string} code - Optional success code.
   * @returns {object} The standard paginated response object.
   */
  paginated: <T>(result: WithPaginationResult<T>, code = 'OK') => ({
    success: true as const,
    code,
    data: result.data,
    meta: result.meta,
  }),

  /**
   * 204 No Content.
   *
   * @returns {void} Undefined as per 204 specification.
   */
  noContent: (): void => undefined,
}
