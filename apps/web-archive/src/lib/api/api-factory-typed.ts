import { queryOptions } from '@tanstack/react-query'

import { HTTPError } from 'ky'

import { queryClient } from '@/lib/tanstack-query'

import { apiClient } from './api-client'
import { ApiError } from './api-error'
import type { KyInstance } from 'ky'

/* -------------------------------------------------------------------------- */
/*  Type-only api factory                                                     */
/* -------------------------------------------------------------------------- */
/**
 * A thin, type-only HTTP client factory. Unlike the legacy Zod-based factory,
 * this performs NO runtime validation — the server owns request/response
 * validation. The web only consumes generated TYPES, keeping the bundle small
 * and the LSP fast.
 *
 * Generated `*.api.ts` files call `apiFactory<TQuery, TBody, TResult>({ ... })`
 * with types supplied from the generated `*.types.ts`. The runtime just fetches
 * and parses JSON.
 */

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
type QueryKey = readonly unknown[]

/** Standard success envelope: `{ success, code, data }`. */
export interface SuccessResponse<T> {
	success: true
	code: string
	data: T
}

/** Standard paginated envelope: `{ success, code, data, meta }`. */
export interface PaginatedResponse<T> {
	success: true
	code: string
	data: T[]
	meta: { page: number; limit: number; total: number; totalPages: number }
}

/** Structured error body returned by the API. */
export interface TErr<T = unknown> {
	code: string | number
	message: string
	data: T
	trace: unknown
}

type IsDefined<T> = [T] extends [never] ? false : undefined extends T ? false : true

/** Fetch args shape derived from which of query/body are present. */
type FetchArgs<TQuery, TBody> =
	IsDefined<TQuery> extends true
		? IsDefined<TBody> extends true
			? { params: TQuery; body: TBody }
			: { params: TQuery }
		: IsDefined<TBody> extends true
			? { body: TBody }
			: void

type InvalidateTarget<TArgs> = string | QueryKey | ((args: TArgs) => string | QueryKey)

interface ApiFactoryConfig<TQuery, TBody, TArgs = FetchArgs<TQuery, TBody>> {
	method: HttpMethod
	url: string
	keys?: ReadonlyArray<string>
	queryKey?: (params: TQuery | undefined) => QueryKey
	invalidates?: ReadonlyArray<InvalidateTarget<TArgs>>
	client?: KyInstance
}

/**
 * Build a typed API endpoint helper.
 *
 * @template TQuery  - query params type (`never` if none)
 * @template TBody   - request body type (`never` if none)
 * @template TResult - unwrapped success payload type (the `data` field)
 */
export function apiFactory<TQuery = never, TBody = never, TResult = unknown>(
	config: ApiFactoryConfig<TQuery, TBody>,
) {
	type Args = FetchArgs<TQuery, TBody>
	type Result = SuccessResponse<TResult>

	const { url, method, client = apiClient, keys = [] } = config

	const fetch = async (args: Args): Promise<Result> => {
		const raw = (args ?? {}) as { params?: unknown; body?: unknown }

		let response: Response
		try {
			response = await client(url, {
				method,
				searchParams: raw.params as Record<string, string> | undefined,
				json: raw.body,
			})
		} catch (error) {
			if (
				error instanceof HTTPError &&
				error.response.headers.get('content-type')?.includes('application/json')
			) {
				const data = await error.response.json<TErr>()
				throw new ApiError(data.message, error.response.status, data)
			}
			throw error
		}

		const json = (await response.json()) as Result

		if (config.invalidates?.length && method !== 'get') {
			for (const target of config.invalidates) {
				const resolved = typeof target === 'function' ? target(args) : target
				const queryKey = typeof resolved === 'string' ? [resolved] : resolved
				void queryClient.invalidateQueries({ queryKey })
			}
		}

		return json
	}

	const queryKey = (params: TQuery | undefined): QueryKey =>
		config.queryKey?.(params) ?? ([url, ...keys, params ?? null] as const)

	const query = (params: TQuery | undefined) =>
		queryOptions({
			queryKey: queryKey(params),
			queryFn: () => fetch((params === undefined ? undefined : { params }) as Args),
		})

	const mutationFn = (args: Args) => fetch(args)

	return { fetch, query, queryKey, mutationFn }
}

/**
 * Same as `apiFactory` but the fetch result is a paginated envelope.
 */
export function apiFactoryList<TQuery = never, TResult = unknown>(
	config: ApiFactoryConfig<TQuery, never>,
) {
	type Result = PaginatedResponse<TResult>

	const { url, method, client = apiClient, keys = [] } = config

	const fetch = async (params: TQuery | undefined): Promise<Result> => {
		const response = await client(url, {
			method,
			searchParams: params as Record<string, string> | undefined,
		})
		return (await response.json()) as Result
	}

	const queryKey = (params: TQuery | undefined): QueryKey =>
		config.queryKey?.(params) ?? ([url, ...keys, params ?? null] as const)

	const query = (params: TQuery | undefined) =>
		queryOptions({ queryKey: queryKey(params), queryFn: () => fetch(params) })

	return { fetch, query, queryKey }
}
