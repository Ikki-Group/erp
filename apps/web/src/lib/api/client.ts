import { API_URL } from '@/config/constant.ts'

/**
 * Minimal HTTP client interface — wraps native `fetch` with a base URL and
 * default headers. Replaces `ky` with zero external dependencies.
 */
export interface ApiClient {
	(url: string, init?: RequestInit): Promise<Response>
	readonly baseUrl: string
}

/** Token accessor — will be wired to auth state once auth module lands. */
let getToken: (() => string | null) | undefined

export function setTokenAccessor(accessor: () => string | null): void {
	getToken = accessor
}

function createClient(baseUrl: string): ApiClient {
	const client = (url: string, init?: RequestInit): Promise<Response> => {
		const fullUrl = `${baseUrl}/${url}`
		const headers = new Headers(init?.headers)

		headers.set('X-Platform', 'web')
		if (!headers.has('Content-Type') && init?.body) {
			headers.set('Content-Type', 'application/json')
		}

		const token = getToken?.()
		if (token) headers.set('Authorization', `Bearer ${token}`)

		return fetch(fullUrl, { ...init, headers, credentials: 'include' })
	}

	Object.defineProperty(client, 'baseUrl', { value: baseUrl, writable: false })
	return client as ApiClient
}

export const httpClient: ApiClient = createClient(API_URL)
