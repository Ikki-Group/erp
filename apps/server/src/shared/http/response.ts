import type { WithPaginationResult } from '@/shared/types/pagination'

/**
 * Standard HTTP response shape helpers.
 * Consistent with createSuccessResponseDto and createPaginatedResponseDto.
 *
 * Note: these helpers only shape the response body. HTTP status codes must
 * still be set via `set.status` in the route handler.
 */
export const res = {
	/**
	 * 200 OK — Standard success with data.
	 */
	ok: <T>(data: T, code = 'OK') => ({ success: true as const, code, data }),

	/**
	 * 200 OK — Successful response with no data payload.
	 */
	noData: (code = 'OK') => ({ success: true as const, code, data: undefined }),

	/**
	 * 201 Created — Successful resource creation.
	 */
	created: <T>(data: T, code = 'CREATED') => ({ success: true as const, code, data }),

	/**
	 * 200 OK — Paginated success.
	 */
	paginated: <T>(result: WithPaginationResult<T>, code = 'OK') => ({
		success: true as const,
		code,
		data: result.data,
		meta: result.meta,
	}),
}
