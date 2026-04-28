import { queryOptions } from '@tanstack/react-query'

import { HTTPError } from 'ky'
import { treeifyError } from 'zod'

import { queryClient } from '@/lib/tanstack-query'

import { apiClient } from './api-client'
import { ApiError } from './api-error'
import type { KyInstance } from 'ky'
import type { ZodError, ZodType, z } from 'zod'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export interface TErr<T = any> {
	code: string | number
	message: string
	data: T
	trace: unknown
}

interface ApiFactoryConfig<
	TParams extends ZodType | undefined,
	TBody extends ZodType | undefined,
	TResult extends ZodType,
> {
	method: HttpMethod
	url: string
	keys?: ReadonlyArray<string>
	invalidates?: ReadonlyArray<string>
	params?: TParams
	body?: TBody
	result: TResult
	client?: KyInstance
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

/* ----------------------------------------------------------------
 * Dev-only validation logger
 * ----------------------------------------------------------------
 * Logs only on validation failures. Includes:
 *   - the validation target (Params / Body / Response)
 *   - the endpoint that triggered the error
 *   - zod treeifyError (human-readable schema diff)
 *   - the raw data that failed validation
 * ---------------------------------------------------------------*/
function logValidationError(
	target: 'Params' | 'Body' | 'Response',
	url: string,
	error: ZodError,
	rawData: unknown,
) {
	if (!import.meta.env.DEV) return

	const label = `[api-factory] ${target} validation failed → ${url}`

	console.group(`%c✗ ${label}`, 'color:#f59e0b;font-weight:bold')
	console.log('%cZod Tree:', 'color:#ef4444;font-weight:600', treeifyError(error))
	console.log('%cRaw Data:', 'color:#6b7280;font-weight:600', rawData)
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
		return validateOrThrow(config.result, json, 'Response', url) as Result
	}

	// React Query helpers
	const queryKey = (params: Params | undefined) => [url, ...keys, params ?? null] as const

	const query = (params: Params | undefined) =>
		queryOptions({
			queryKey: queryKey(params),
			queryFn: () => fetch((config.params ? { params } : undefined) as Args),
		} as const)

	const mutationFn = (args: Args) => fetch(args)

	const mutation = () =>
		({
			mutationFn: fetch as (args: Args) => Promise<Result>,
			onSuccess: () => {
				if (config.invalidates?.length) {
					for (const url of config.invalidates) {
						queryClient.invalidateQueries({ queryKey: [url] })
					}
				}
			},
		}) as const

	return {
		fetch,
		query,
		queryKey,
		mutationFn,
		mutation,

		// Inference helpers (DX)
		_types: {
			params: null as unknown as Params,
			result: null as unknown as Result,
			args: null as unknown as Args,
		},
	}
}
