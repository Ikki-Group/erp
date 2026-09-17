import { API_URL, IS_MOCK_API } from '@/config/constant.ts'

import { createMockClient } from '@/lib/mock/client.ts'

/**
 * Minimal HTTP client interface — wraps native `fetch` with a base URL and
 * default headers. Replaces `ky` with zero external dependencies.
 */
export interface ApiClient {
	(url: string, init?: RequestInit): Promise<Response>
	readonly baseUrl: string
}

function createClient(baseUrl: string): ApiClient {
	// Auth is cookie-based: the session cookie rides on `credentials: 'include'`,
	// so there is no bearer token to attach here.
	const client = (url: string, init?: RequestInit): Promise<Response> => {
		const fullUrl = `${baseUrl}/${url}`
		const headers = new Headers(init?.headers)

		headers.set('X-Platform', 'web')
		if (!headers.has('Content-Type') && init?.body) {
			headers.set('Content-Type', 'application/json')
		}

		return fetch(fullUrl, { ...init, headers, credentials: 'include' })
	}

	Object.defineProperty(client, 'baseUrl', { value: baseUrl, writable: false })
	return client as ApiClient
}

/**
 * Default client used by every `defineQuery`/`defineMutation`/`defineResource`
 * call. In mock mode (`VITE_API_MODE=mock`) this is the in-memory
 * `createMockClient()` from `@/lib/mock` instead of a real network fetch —
 * see `IS_MOCK_API` in `@/config/constant.ts`. Feature/route code never
 * branches on the mode; it only ever calls `httpClient`.
 */
export const httpClient: ApiClient = IS_MOCK_API ? createMockClient() : createClient(API_URL)
