import { HTTPError } from 'ky'

import { apiClient } from '../../api-client'
import { ApiError } from './errors'
import type { ApiErrorDetails } from './errors'
import type { HttpMethod } from './types'
import type { KyInstance } from 'ky'

/**
 * Flattens a query object into a `URLSearchParams` instance.
 *
 * `ky`'s `SearchParamsOption` type only natively supports
 * `Record<string, string | number | boolean | undefined>` — arrays are
 * NOT a valid value shape. To support array params (e.g. `ids: [1, 2]`)
 * correctly (repeated keys: `ids=1&ids=2`), we build the `URLSearchParams`
 * ourselves — a `URLSearchParams` instance is itself a valid
 * `SearchParamsOption`, so this is the safe, correct approach.
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

export interface RequestOptions {
	client?: KyInstance
	method: HttpMethod
	url: string
	query?: Record<string, unknown>
	body?: unknown
	signal?: AbortSignal
}

/**
 * Performs an HTTP request via `ky`, normalizing failures into `ApiError`.
 *
 * - HTTP error responses (4xx/5xx) with a JSON body are unwrapped into a
 *   structured `ApiError` (`status` + `details`).
 * - Network errors, timeouts, and non-JSON HTTP errors are re-thrown as-is
 *   (callers can still distinguish them via `error instanceof ApiError`).
 * - `signal` is forwarded straight to `ky`, wiring up React Query's
 *   abort-on-unmount/refetch behavior end-to-end.
 */
export async function request<TJson = unknown>({
	client = apiClient,
	method,
	url,
	query,
	body,
	signal,
}: RequestOptions): Promise<TJson> {
	let response: Response

	try {
		response = await client(url, {
			method,
			searchParams: query ? buildSearchParams(query) : undefined,
			json: body,
			signal,
		})
	} catch (error) {
		if (
			error instanceof HTTPError &&
			error.response.headers.get('content-type')?.includes('application/json')
		) {
			const data = await error.response.json<ApiErrorDetails>()
			throw new ApiError(data.message, error.response.status, data)
		}
		// Network / timeout / non-JSON HTTP errors — re-thrown as-is
		throw error
	}

	return (await response.json()) as TJson
}
