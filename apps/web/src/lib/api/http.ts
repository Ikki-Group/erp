import { httpClient, type ApiClient } from './client.ts'
import { ApiError } from './errors.ts'
import type { ApiErrorPayload } from './errors.ts'
import type { HttpMethod } from './types.ts'

/**
 * Flattens a query object into a `URLSearchParams` instance.
 *
 * - `null`/`undefined` values are skipped entirely.
 * - Arrays are flattened via repeated `.append(key, String(item))`.
 * - Everything else is stringified as-is.
 */
export function buildSearchParams(query: Record<string, unknown> | undefined): URLSearchParams {
	const searchParams = new URLSearchParams()
	if (!query) return searchParams

	for (const [key, value] of Object.entries(query)) {
		if (value === null || value === undefined) continue

		if (Array.isArray(value)) {
			for (const item of value) {
				if (item === null || item === undefined) continue
				searchParams.append(key, String(item))
			}
			continue
		}

		searchParams.append(key, String(value))
	}

	return searchParams
}

/** Normalizes any thrown value into an `ApiError`, preserving abort semantics. */
async function normalizeError(error: unknown, response?: Response): Promise<never> {
	// HTTP error response
	if (response && !response.ok) {
		const contentType = response.headers.get('content-type')
		let body: unknown

		if (contentType?.includes('application/json')) {
			try {
				body = await response.clone().json()
			} catch {
				// Body wasn't valid JSON despite the content-type header
			}
		}

		if (isErrorPayload(body)) throw ApiError.fromPayload(body, response.status)
		throw new ApiError(response.statusText || 'Request failed', { status: response.status })
	}

	// Preserve abort semantics (query cancellation on unmount/refetch)
	if (error instanceof DOMException && error.name === 'AbortError') {
		throw error
	}

	if (error instanceof TypeError && error.message.includes('fetch')) {
		throw new ApiError('Network error — unable to reach the server.', { cause: error })
	}

	if (error instanceof Error) {
		throw new ApiError(error.message, { cause: error })
	}

	throw new ApiError('An unknown error occurred.', { cause: error })
}

function isErrorPayload(body: unknown): body is ApiErrorPayload {
	if (typeof body !== 'object' || body === null || !('error' in body)) return false
	const { error } = body
	return typeof error === 'object' && error !== null && 'code' in error && 'message' in error
}

export interface RequestConfig {
	client?: ApiClient
	method: HttpMethod
	url: string
	query?: Record<string, unknown>
	body?: unknown
	signal?: AbortSignal
}

/**
 * Performs an HTTP request via native `fetch`, normalizing failures into `ApiError`.
 */
export async function requestJson<TJson = unknown>({
	client = httpClient,
	method,
	url,
	query,
	body,
	signal,
}: RequestConfig): Promise<TJson> {
	const searchParams = query ? buildSearchParams(query) : undefined
	const queryString = searchParams?.toString()
	const fullUrl = queryString ? `${url}?${queryString}` : url

	let response: Response

	try {
		response = await client(fullUrl, {
			method: method.toUpperCase(),
			body: body ? JSON.stringify(body) : undefined,
			signal,
		})
	} catch (error) {
		return normalizeError(error)
	}

	if (!response.ok) {
		return normalizeError(null, response)
	}

	return (await response.json()) as TJson
}
