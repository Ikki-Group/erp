import { describe, expect, it } from 'vitest'

import type { ApiClient } from './client.ts'
import { ApiError } from './errors.ts'
import { requestJson } from './http.ts'

function clientReturning(status: number, body: unknown): ApiClient {
	const client = async () =>
		new Response(JSON.stringify(body), {
			status,
			headers: { 'content-type': 'application/json' },
		})
	return Object.assign(client, { baseUrl: '' })
}

describe('requestJson error envelope', () => {
	it("reads code, message and context from the server's nested `error`", async () => {
		const client = clientReturning(403, {
			success: false,
			error: {
				path: '/x',
				code: 'LOCATION_ACCESS_DENIED',
				message: 'Location access denied',
				context: { locationId: 2 },
			},
		})
		const error = await requestJson({ client, method: 'get', url: 'x' }).catch((e: unknown) => e)
		expect(error).toBeInstanceOf(ApiError)
		expect(error).toMatchObject({
			status: 403,
			code: 'LOCATION_ACCESS_DENIED',
			message: 'Location access denied',
			data: { locationId: 2 },
		})
	})

	it('falls back to the status text for a body without the envelope', async () => {
		const client = clientReturning(500, { nope: true })
		const error = await requestJson({ client, method: 'get', url: 'x' }).catch((e: unknown) => e)
		expect(error).toMatchObject({ status: 500, code: undefined })
	})
})
