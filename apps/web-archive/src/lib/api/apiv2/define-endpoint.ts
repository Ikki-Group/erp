import { mutationOptions, queryOptions } from '@tanstack/react-query'
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'

import { queryClient } from '@/lib/tanstack-query'

import type { ApiError } from './core/errors'
import { request } from './core/http'
import type { HttpMethod, Input, MutationMethod, Output, QueryKey } from './core/types'
import { validateOrThrow } from './core/validate'
import type { KyInstance } from 'ky'
import type { ZodType } from 'zod'

/* ================================================================
 * Query endpoints (method: 'get')
 * ================================================================ */

export interface QueryEndpointConfig<TQuery extends ZodType | undefined, TResult extends ZodType> {
	method: 'get'
	url: string
	/** Zod schema validating the query/search params sent with the request. */
	query?: TQuery
	/** Zod schema validating the parsed response body. */
	result: TResult
	/** Customize the React Query key. Defaults to `[url, query ?? null]`. */
	queryKey?: (query: Input<TQuery> | undefined) => QueryKey
	client?: KyInstance
}

export interface QueryEndpoint<TQuery extends ZodType | undefined, TResult extends ZodType> {
	readonly method: 'get'
	/** Performs the request directly, bypassing React Query. */
	fetch: (query?: Input<TQuery>, signal?: AbortSignal) => Promise<Output<TResult>>
	/** Builds the React Query key for a given set of query params. */
	queryKey: (query?: Input<TQuery>) => QueryKey
	/**
	 * Builds a `queryOptions()` object ready to pass to `useQuery`/
	 * `useSuspenseQuery`/`queryClient.prefetchQuery`, etc.
	 */
	queryOptions: (
		query?: Input<TQuery>,
		overrides?: Omit<
			UseQueryOptions<Output<TResult>, ApiError, Output<TResult>>,
			'queryKey' | 'queryFn'
		>,
	) => ReturnType<typeof queryOptions<Output<TResult>, ApiError, Output<TResult>, QueryKey>>
}

function createQueryEndpoint<TQuery extends ZodType | undefined, TResult extends ZodType>(
	config: QueryEndpointConfig<TQuery, TResult>,
): QueryEndpoint<TQuery, TResult> {
	const { url, client } = config
	type Query = Input<TQuery>
	type Result = Output<TResult>

	const fetchImpl = async (query?: Query, signal?: AbortSignal): Promise<Result> => {
		const validatedQuery = config.query ? validateOrThrow(config.query, query, 'Query', url) : query

		const json = await request({
			client,
			method: 'get',
			url,
			query: validatedQuery as Record<string, unknown> | undefined,
			signal,
		})

		return validateOrThrow(config.result, json, 'Response', url) as Result
	}

	const queryKeyImpl = (query?: Query): QueryKey =>
		config.queryKey?.(query) ?? ([url, query ?? null] as const)

	return {
		method: 'get',
		fetch: fetchImpl,
		queryKey: queryKeyImpl,
		queryOptions: (query, overrides) =>
			queryOptions({
				queryKey: queryKeyImpl(query),
				queryFn: ({ signal }) => fetchImpl(query, signal),
				...overrides,
			} as Parameters<typeof queryOptions<Result, ApiError, Result, QueryKey>>[0]),
	}
}

/* ================================================================
 * Mutation endpoints (method: 'post' | 'put' | 'patch' | 'delete')
 * ================================================================ */

type MutationArgs<
	TQuery extends ZodType | undefined,
	TBody extends ZodType | undefined,
> = TQuery extends ZodType
	? TBody extends ZodType
		? { query: Input<TQuery>; body: Input<TBody> }
		: { query: Input<TQuery> }
	: TBody extends ZodType
		? { body: Input<TBody> }
		: void

type InvalidateTarget<TArgs, TResult> = QueryKey | ((args: TArgs, result: TResult) => QueryKey)

export interface MutationEndpointConfig<
	TQuery extends ZodType | undefined,
	TBody extends ZodType | undefined,
	TResult extends ZodType,
> {
	method: MutationMethod
	url: string
	/** Zod schema validating the query/search params sent with the request. */
	query?: TQuery
	/** Zod schema validating the JSON body sent with the request. */
	body?: TBody
	/** Zod schema validating the parsed response body. */
	result: TResult
	/**
	 * Query keys to invalidate (via `queryClient.invalidateQueries`) after
	 * a successful mutation. Runs inside `fetch` itself — uniformly whether
	 * the endpoint is invoked directly or through `mutationOptions()`, and
	 * independently of any `onSuccess` a consumer passes as an override.
	 */
	invalidates?: ReadonlyArray<InvalidateTarget<MutationArgs<TQuery, TBody>, Output<TResult>>>
	client?: KyInstance
}

export interface MutationEndpoint<
	TQuery extends ZodType | undefined,
	TBody extends ZodType | undefined,
	TResult extends ZodType,
> {
	readonly method: MutationMethod
	/** Performs the request directly, bypassing React Query. */
	fetch: (args: MutationArgs<TQuery, TBody>) => Promise<Output<TResult>>
	/**
	 * Builds a `mutationOptions()` object ready to pass to `useMutation`.
	 * Any `onSuccess`/`onError`/etc. passed as `overrides` runs after
	 * apiv2's own invalidation logic, via React Query's normal lifecycle.
	 */
	mutationOptions: (
		overrides?: Omit<
			UseMutationOptions<Output<TResult>, ApiError, MutationArgs<TQuery, TBody>>,
			'mutationFn'
		>,
	) => ReturnType<typeof mutationOptions<Output<TResult>, ApiError, MutationArgs<TQuery, TBody>>>
}

function createMutationEndpoint<
	TQuery extends ZodType | undefined,
	TBody extends ZodType | undefined,
	TResult extends ZodType,
>(
	config: MutationEndpointConfig<TQuery, TBody, TResult>,
): MutationEndpoint<TQuery, TBody, TResult> {
	const { url, method, client } = config
	type Args = MutationArgs<TQuery, TBody>
	type Result = Output<TResult>

	const fetchImpl = async (args: Args): Promise<Result> => {
		const raw = (args ?? {}) as Record<string, unknown>

		const query = config.query ? validateOrThrow(config.query, raw.query, 'Query', url) : undefined
		const body = config.body ? validateOrThrow(config.body, raw.body, 'Body', url) : undefined

		const json = await request({
			client,
			method,
			url,
			query: query as Record<string, unknown> | undefined,
			body,
		})

		const result = validateOrThrow(config.result, json, 'Response', url) as Result

		if (config.invalidates?.length) {
			for (const target of config.invalidates) {
				const queryKey = typeof target === 'function' ? target(args, result) : target
				queryClient.invalidateQueries({ queryKey })
			}
		}

		return result
	}

	return {
		method: method as unknown as MutationMethod,
		fetch: fetchImpl,
		mutationOptions: (overrides) =>
			mutationOptions({
				mutationFn: fetchImpl,
				...overrides,
			}),
	}
}

/* ================================================================
 * defineEndpoint — method-aware overloads
 * ================================================================
 * The overload signatures ensure a `method: 'get'` config can ONLY
 * produce a `QueryEndpoint` (queryKey/queryOptions, no mutationOptions),
 * and a mutating `method` can ONLY produce a `MutationEndpoint`
 * (mutationOptions, no queryOptions/queryKey) — the mismatch between
 * query and mutation usage is prevented at the type level.
 * ---------------------------------------------------------------*/

export function defineEndpoint<TQuery extends ZodType | undefined, TResult extends ZodType>(
	config: QueryEndpointConfig<TQuery, TResult>,
): QueryEndpoint<TQuery, TResult>
export function defineEndpoint<
	TQuery extends ZodType | undefined,
	TBody extends ZodType | undefined,
	TResult extends ZodType,
>(config: MutationEndpointConfig<TQuery, TBody, TResult>): MutationEndpoint<TQuery, TBody, TResult>
export function defineEndpoint(
	config:
		| QueryEndpointConfig<ZodType | undefined, ZodType>
		| MutationEndpointConfig<ZodType | undefined, ZodType | undefined, ZodType>,
) {
	if (config.method === 'get') return createQueryEndpoint(config)
	return createMutationEndpoint(config)
}

export type { HttpMethod, MutationMethod, QueryKey }
