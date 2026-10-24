import { queryOptions } from '@tanstack/react-query'

import { HTTPError } from 'ky'
import { treeifyError } from 'zod'

import { queryClient } from '@/lib/tanstack-query'

import { apiClient } from './api-client'
import { ApiError } from './api-error'
import type { KyInstance } from 'ky'
import type { ZodError, ZodType, z } from 'zod'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
type QueryKey = readonly unknown[]

export interface TErr<T = any> {
	code: string | number
	message: string
	data: T
	trace: unknown
}

// Type Utilities
type IsDefined<T> = T extends undefined ? false : true
type Input<T> = T extends ZodType ? z.input<T> : never
type Output<T> = T extends ZodType ? z.output<T> : never

type FetchArgs<TParams, TBody> =
	IsDefined<TParams> extends true
		? IsDefined<TBody> extends true
			? { params: Input<TParams>; body: Input<TBody> }
			: { params: Input<TParams> }
		: IsDefined<TBody> extends true
			? { body: Input<TBody> }
			: undefined

type InvalidateTarget<TArgs> = string | QueryKey | ((args: TArgs) => string | QueryKey)

interface ApiFactoryConfig<
	TParams extends ZodType | undefined,
	TBody extends ZodType | undefined,
	TResult extends ZodType,
	TArgs = FetchArgs<TParams, TBody>,
> {
	method: HttpMethod
	url: string
	keys?: ReadonlyArray<string>
	queryKey?: (params: Input<TParams> | undefined) => QueryKey
	invalidates?: ReadonlyArray<InvalidateTarget<TArgs>>
	params?: TParams
	body?: TBody
	result: TResult
	client?: KyInstance
}

/* ----------------------------------------------------------------
 * Dev-only validation logger
 * ----------------------------------------------------------------
 * Logs only on validation failures. Includes:
 *   - the validation target (Params / Body / Response)
 *   - the endpoint that triggered the error
 *   - zod treeifyError (human-readable schema diff)
 *   - the raw data that failed validation
 *   - the expected schema for comparison
 *   - error path to quickly locate the issue
 * ---------------------------------------------------------------*/
function logValidationError(
	target: 'Params' | 'Body' | 'Response',
	url: string,
	error: ZodError,
	rawData: unknown,
) {
	if (!import.meta.env.DEV) return

	const label = `[api-factory] ${target} validation failed → ${url}`

	console.group(`%c✗ ${label}`, 'color:#f59e0b;font-weight:bold;font-size:14px')
	console.log(
		'%c📋 Error Path:',
		'color:#ef4444;font-weight:600',
		error.issues[0]?.path.join('.') ?? 'root',
	)
	console.log('%c❌ Error Message:', 'color:#ef4444;font-weight:600', error.issues[0]?.message)
	console.log('%c🌳 Zod Tree:', 'color:#ef4444;font-weight:600', treeifyError(error))
	console.log('%c📦 Raw Data:', 'color:#6b7280;font-weight:600', rawData)
	console.log('%c📝 All Issues:', 'color:#6b7280;font-weight:600', error.issues)
	console.trace('%c📍 Stack Trace:', 'color:#8b5cf6;font-weight:600')
	console.groupEnd()
}

/* ----------------------------------------------------------------
 * Validate a value against a Zod schema (safeParse + log on fail)
 * Returns parsed data or throws the ZodError.
 * ---------------------------------------------------------------*/
function validateOrThrow<S extends ZodType>(
	schema: S,
	data: unknown,
	target: 'Params' | 'Body' | 'Response',
	url: string,
): z.output<S> {
	const result = schema.safeParse(data)
	if (result.success) return result.data

	logValidationError(target, url, result.error, data)
	throw result.error
}

export function apiFactory<
	TParams extends ZodType | undefined,
	TBody extends ZodType | undefined,
	TResult extends ZodType,
>({ client = apiClient, keys = [], ...config }: ApiFactoryConfig<TParams, TBody, TResult>) {
	type Args = FetchArgs<TParams, TBody>
	type Result = Output<TResult>
	type Params = Input<TParams>

	const { url, method } = config

	const fetch = async (args: Args): Promise<Result> => {
		const raw = (args ?? {}) as Record<string, unknown>
		const params = config.params
			? validateOrThrow(config.params, raw.params, 'Params', url)
			: raw.params
		const body = config.body ? validateOrThrow(config.body, raw.body, 'Body', url) : undefined

		let response: Response

		try {
			response = await client(url, {
				method,
				searchParams: params as Record<string, string>,
				json: body,
			})
		} catch (error) {
			// HTTP errors (4xx / 5xx) — extract structured body when available
			if (
				error instanceof HTTPError &&
				error.response.headers.get('content-type')?.includes('application/json')
			) {
				const data = await error.response.json<TErr>()
				throw new ApiError(data.message, error.response.status, data)
			}
			// Network / timeout / non-JSON HTTP errors — re-throw as-is
			throw error
		}

		// Parse & validate response body
		const json: unknown = await response.json()
		const result = validateOrThrow(config.result, json, 'Response', url) as Result

		// Auto-invalidate declared query keys on successful mutation
		if (config.invalidates?.length && method !== 'get') {
			for (const target of config.invalidates) {
				const resolved = typeof target === 'function' ? target(args) : target
				const queryKey = typeof resolved === 'string' ? [resolved] : resolved
				queryClient.invalidateQueries({ queryKey })
			}
		}

		return result
	}

	// React Query helpers
	const queryKey = (params: Params | undefined) =>
		config.queryKey?.(params) ?? ([url, ...keys, params ?? null] as const)

	const query = (params: Params | undefined) =>
		queryOptions({
			queryKey: queryKey(params),
			queryFn: () => fetch((config.params ? { params } : undefined) as Args),
		} as const)

	const mutationFn = (args: Args) => fetch(args)

	return {
		fetch,
		query,
		queryKey,
		mutationFn,

		// Inference helpers (DX)
		_types: {
			params: null as unknown as Params,
			result: null as unknown as Result,
			args: null as unknown as Args,
		},
	}
}
