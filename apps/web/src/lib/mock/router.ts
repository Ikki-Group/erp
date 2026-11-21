import type { HttpMethod } from '@/lib/api/types.ts'

import { mockError } from './response.ts'
import type { MockRouteHandler } from './types.ts'

type RouteKey = `${HttpMethod} ${string}`

const routes = new Map<RouteKey, MockRouteHandler>()

/** Registers a mock handler for `method` + `path` (path has no query string). */
export function registerRoute(method: HttpMethod, path: string, handler: MockRouteHandler): void {
	routes.set(`${method} ${path}`, handler)
}

/** Artificial network latency so skeletons/spinners stay visible and honest. */
const MOCK_LATENCY_MS = 220

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

/**
 * Drop-in replacement for `fetch` used by the mock `ApiClient` (see
 * `@/lib/api/client.ts`). Parses the request the same way the real HTTP
 * layer built it (`method` + `path?query` + JSON `body`), dispatches to the
 * registered handler, and returns a `Response` — everything downstream
 * (`requestJson`, Zod `result` parsing) is unaware it isn't a real network
 * call.
 */
export async function mockFetch(url: string, init?: RequestInit): Promise<Response> {
	await delay(MOCK_LATENCY_MS)

	const method = (init?.method ?? 'GET').toLowerCase() as HttpMethod
	const [path = '', queryString] = url.split('?')
	const params = new URLSearchParams(queryString ?? '')
	const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined

	const handler = routes.get(`${method} ${path}`)
	if (!handler) {
		return mockError(
			501,
			`No mock handler registered for ${method.toUpperCase()} ${path}`,
			'MOCK_NOT_IMPLEMENTED',
		)
	}

	return handler(params, body)
}
