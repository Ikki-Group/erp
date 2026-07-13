import { isHTTPError, isTimeoutError } from 'ky'
import type { KyInstance } from 'ky'

import { httpClient } from './client'
import { ApiError } from './errors'
import type { ApiErrorPayload } from './errors'
import type { HttpMethod } from './types'

/**
 * Flattens a query object into a `URLSearchParams` instance.
 *
 * `ky`'s `SearchParamsOption` only natively supports
 * `Record<string, string | number | boolean | undefined>` — arrays aren't a
 * valid value shape. To support array params (e.g. `ids: [1, 2]`) correctly
 * as repeated keys (`ids=1&ids=2`), we build the `URLSearchParams`
 * ourselves — a `URLSearchParams` instance is itself a valid
 * `SearchParamsOption`.
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

/** Normalizes any thrown value from `client()` into an `ApiError`, preserving abort semantics. */
async function normalizeError(error: unknown): Promise<never> {
	if (isHTTPError(error)) {
		const contentType = error.response.headers.get('content-type')
		let payload: ApiErrorPayload | undefined

		if (contentType?.includes('application/json')) {
			try {
				payload = (await error.response.clone().json()) as ApiErrorPayload
			} catch {
				// Body wasn't valid JSON despite the content-type header — fall through below.
			}
		}

		if (payload) throw ApiError.fromPayload(payload, error.response.status)
		throw new ApiError(error.message, { status: error.response.status, cause: error })
	}

	if (isTimeoutError(error)) {
		throw new ApiError('Request timed out.', { cause: error })
	}

	// Preserve abort semantics (query cancellation on unmount/refetch) so
	// React Query treats it as a cancellation, not a real error.
	if (error instanceof DOMException && error.name === 'AbortError') {
		throw error
	}

	if (error instanceof Error) {
		throw new ApiError(error.message, { cause: error })
	}

	throw new ApiError('An unknown error occurred.', { cause: error })
}

export interface RequestConfig {
	client?: KyInstance
	method: HttpMethod
	url: string
	query?: Record<string, unknown>
	body?: unknown
	signal?: AbortSignal
}

/**
 * Performs an HTTP request via `ky`, normalizing failures into `ApiError`.
 * `signal` is forwarded straight through, wiring up React Query's
 * abort-on-unmount/refetch behavior end-to-end.
 */
export async function requestJson<TJson = unknown>({
	client = httpClient,
	method,
	url,
	query,
	body,
	signal,
}: RequestConfig): Promise<TJson> {
	let response: Response

	try {
		response = await client(url, {
			method,
			searchParams: query ? buildSearchParams(query) : undefined,
			json: body,
			signal,
		})
	} catch (error) {
		return normalizeError(error)
	}

	return (await response.json()) as TJson
}
