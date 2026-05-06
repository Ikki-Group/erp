import type { Modules } from '@/modules/_registry'
import { initRoutes } from '@/modules/_routes'

import { createApp } from '@/app'

export interface TestClient {
	get: (path: string, opts?: RequestInit) => Promise<Response>
	post: (path: string, body: unknown, opts?: RequestInit) => Promise<Response>
	put: (path: string, body: unknown, opts?: RequestInit) => Promise<Response>
	del: (path: string, body?: unknown, opts?: RequestInit) => Promise<Response>
	withAuth: (token: string) => TestClient
}

/**
 * Create HTTP test client for Elysia app.
 * Wraps app.handle() with convenient methods.
 */
export function createTestClient(modules: Modules): TestClient {
	const app = createApp(modules)
	initRoutes(modules).register(app)

	const baseUrl = 'http://localhost'
	let authHeaders: Record<string, string> = {}

	const request = (method: string, path: string, opts?: RequestInit): Promise<Response> => {
		const url = path.startsWith('http') ? path : `${baseUrl}${path}`
		return app.handle(
			new Request(url, {
				method,
				...opts,
				headers: {
					...opts?.headers,
					...authHeaders,
				},
			}),
		)
	}

	const client: TestClient = {
		get: (path, opts) => request('GET', path, opts),

		post: (path, body, opts) =>
			request('POST', path, {
				...opts,
				body: JSON.stringify(body),
				headers: {
					'content-type': 'application/json',
					...opts?.headers,
				},
			}),

		put: (path, body, opts) =>
			request('PUT', path, {
				...opts,
				body: JSON.stringify(body),
				headers: {
					'content-type': 'application/json',
					...opts?.headers,
				},
			}),

		del: (path, body, opts) =>
			request('DELETE', path, {
				...opts,
				body: body ? JSON.stringify(body) : undefined,
				headers: {
					'content-type': 'application/json',
					...opts?.headers,
				},
			}),

		withAuth: (token) => {
			authHeaders = { authorization: `Bearer ${token}` }
			return client
		},
	}

	return client
}
