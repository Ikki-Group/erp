import { API_URL, IS_MOCK_API } from '@/config/constant.ts'

import { createMockClient } from '@/lib/mock/client.ts'

import { getActiveLocationId } from './active-location.ts'

export const TOKEN_STORAGE_KEY = 'ikki-session-token'

export function getStoredToken(): string | null {
	return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredToken(token: string): void {
	localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearStoredToken(): void {
	localStorage.removeItem(TOKEN_STORAGE_KEY)
}

/**
 * Minimal HTTP client interface — wraps native `fetch` with a base URL and
 * default headers. Replaces `ky` with zero external dependencies.
 */
export interface ApiClient {
	(url: string, init?: RequestInit): Promise<Response>
	readonly baseUrl: string
}

function createClient(baseUrl: string): ApiClient {
	const client = (url: string, init?: RequestInit): Promise<Response> => {
		const fullUrl = `${baseUrl}/${url}`
		const headers = new Headers(init?.headers)

		headers.set('X-Platform', 'web')
		if (!headers.has('Content-Type') && init?.body) {
			headers.set('Content-Type', 'application/json')
		}

		const token = getStoredToken()
		if (token) headers.set('Authorization', `Bearer ${token}`)

		const locationId = getActiveLocationId()
		if (locationId !== null) headers.set('X-Location-ID', String(locationId))

		return fetch(fullUrl, { ...init, headers })
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
