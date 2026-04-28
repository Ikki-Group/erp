import { expect } from 'bun:test'

interface SuccessResponse<T> {
	success: true
	code: string
	data: T
}

interface PaginatedResponse<T> extends SuccessResponse<T[]> {
	meta: {
		total: number
		page: number
		pageSize: number
		totalPages: number
	}
}

export function expectSuccessResponse<T>(
	response: unknown,
): asserts response is SuccessResponse<T> {
	expect(response).toBeObject()
	expect(response).toHaveProperty('success', true)
	expect(response).toHaveProperty('code')
	expect(response).toHaveProperty('data')
}

export function expectPaginatedResponse<T>(
	response: unknown,
): asserts response is PaginatedResponse<T> {
	expectSuccessResponse<T[]>(response)
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	const r = response as PaginatedResponse<T>
	expect(r).toHaveProperty('meta')
	expect(r.meta).toBeObject()
	expect(r.meta).toHaveProperty('total')
	expect(r.meta).toHaveProperty('page')
	expect(r.meta).toHaveProperty('limit')
	expect(r.meta).toHaveProperty('totalPages')
}

export function expectValidationError(response: unknown, expectedMessage?: string) {
	expect(response).toBeObject()
	expect(response).toHaveProperty('success', false)
	expect(response).toHaveProperty('code', 'VALIDATION')
	if (expectedMessage) {
		expect(response).toHaveProperty('message', expect.stringContaining(expectedMessage))
	}
}

export function expectUnauthorizedError(response: unknown) {
	expect(response).toBeObject()
	expect(response).toHaveProperty('success', false)
	expect(response).toHaveProperty('code', 'AUTH_UNAUTHORIZED')
}

export function expectNotFoundError(response: unknown) {
	expect(response).toBeObject()
	expect(response).toHaveProperty('success', false)
	expect(response).toHaveProperty('code', 'NOT_FOUND')
}
