/**
 * Response builders matching the server's real envelope shapes
 * (`createSuccessResponseSchema` / `createPaginatedResponseSchema` /
 * `ApiErrorPayload` in `@/lib/validation` and `@/lib/api/errors.ts`), so the
 * existing Zod-validated API layer accepts mock responses without change.
 */

function jsonResponse(body: unknown, status: number): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	})
}

export function mockSuccess<T>(data: T, status = 200): Response {
	return jsonResponse({ success: true, code: 'OK', data }, status)
}

export interface MockPaginationInput {
	page: number
	limit: number
	total: number
}

export function mockPaginated<T>(items: T[], meta: MockPaginationInput): Response {
	const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit))
	return jsonResponse(
		{ success: true, code: 'OK', data: items, meta: { ...meta, totalPages } },
		200,
	)
}

export function mockError(status: number, message: string, code = 'MOCK_ERROR'): Response {
	return jsonResponse({ code, message }, status)
}
