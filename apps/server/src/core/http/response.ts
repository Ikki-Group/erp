import type { WithPaginationResult } from '../utils/pagination'

/**
 * Standard HTTP Response Wrapper.
 * Consistent with createSuccessResponseSchema and createPaginatedResponseSchema.
 */
export const res = {
	/**
	 * 200 OK - Standard success with data.
	 */
	ok: <T>(data: T, code = 'OK') => ({ success: true as const, code, data }),

	/**
	 * 200 OK - Standard success without data.
	 */
	noData: (code = 'OK') => ({ success: true as const, code, data: undefined }),

	/**
	 * 201 Created - Succesfull resource creation.
	 */
	created: <T>(data: T, code = 'CREATED') => ({ success: true as const, code, data }),

	/**
	 * 200 OK - Standard paginated success.
	 */
	paginated: <T>(result: WithPaginationResult<T>, code = 'OK') => ({
		success: true as const,
		code,
		data: result.data,
		meta: result.meta,
	}),

	/**
	 * 204 No Content.
	 */
	noContent: (): void => undefined,
}
