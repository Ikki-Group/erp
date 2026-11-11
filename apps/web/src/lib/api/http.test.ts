import { describe, expect, it } from 'vitest'

import type { ApiClient } from './client.ts'
import { ApiError } from './errors.ts'
import { requestJson } from './http.ts'

function clientReturning(status: number, body: unknown): ApiClient {
	return Object.assign(
		() =>
			Promise.resolve(
				new Response(JSON.stringify(body), {
					status,
					headers: { 'content-type': 'application/json' },
				}),
			),
		{ baseUrl: 'http://api.test' },
	)
}

async function failure(client: ApiClient): Promise<ApiError> {
	try {
		await requestJson({ client, method: 'post', url: 'auth/password' })
	} catch (error) {
		if (error instanceof ApiError) return error
		throw error
	}
	throw new Error('expected the request to fail')
}

describe('requestJson error normalization', () => {
	it('reads code, message and context from the server error envelope', async () => {
		const error = await failure(
			clientReturning(400, {
				success: false,
				error: {
					path: '/auth/password',
					code: 'INVALID_CURRENT_PASSWORD',
					message: 'Current password is incorrect',
					context: { attempt: 1 },
				},
			}),
		)
		expect(error).toMatchObject({
			status: 400,
			code: 'INVALID_CURRENT_PASSWORD',
			message: 'Current password is incorrect',
			data: { attempt: 1 },
		})
	})

	it('falls back to the status text for a body that is not an error envelope', async () => {
		const error = await failure(clientReturning(502, { unexpected: true }))
		expect(error.status).toBe(502)
		expect(error.code).toBeUndefined()
	})
})
