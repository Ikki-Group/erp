import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'
import type { z, ZodType } from 'zod'

import { queryClient } from '@/lib/tanstack-query'

import type { ApiClient } from './client'
import { requestJson } from './http'
import type { Args, HttpMethod, Input, MaybeSchema, QueryKey, TaggedQueryKey } from './types'
import { parseOrThrow } from './validate'

/* -------------------------------------------------------------------------- */
/*  Shared plumbing                                                            */
/* -------------------------------------------------------------------------- */

/** Splits the public bare-or-wrapped `Args` shape back into `{ query, body }` for the wire. */
function splitArgs(args: unknown, hasQuery: boolean, hasBody: boolean): { query?: unknown; body?: unknown } {
	if (hasQuery && hasBody) {
		const wrapped = (args ?? {}) as { query?: unknown; body?: unknown }
		return { query: wrapped.query, body: wrapped.body }
	}
	if (hasQuery) return { query: args }
	if (hasBody) return { body: args }
	return {}
}

interface BaseEndpointConfig<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType> {
	method: HttpMethod
	/**
	 * Sourced from the centralized `@/config/endpoint` registry (generated
	 * from the server's contracts — see AGENTS.md's `generate:endpoints`).
	 * Always reference `endpoint.<feature>.<action>` here rather than an
	 * inline literal: it keeps every URL the frontend calls in one
	 * auditable, type-checked place, and it's what makes the default
	 * URL-anchored `queryKey` below safe to invalidate from *any* other
	 * feature — importing `endpoint` never creates a cycle, since it has no
	 * dependencies of its own (a pure leaf module).
	 */
	url: string
	/** Schema for outgoing query-string params. Omit if the endpoint has none. */
	query?: TQuery
	/** Schema for the outgoing JSON body. Omit if the endpoint has none. */
	body?: TBody
	/** Schema for the full response envelope (e.g. `createSuccessResponseSchema(...)`). */
	result: TResult
	/** Override the HTTP client — defaults to the shared `httpClient`. */
	client?: ApiClient
}

/**
 * Builds the single fetch function shared by both query and mutation
 * endpoints: split args → validate query/body → perform the request →
 * validate the response. Keeping this in one place is what lets
 * `createQueryEndpoint` and `createMutationEndpoint` differ *only* in their
 * React Query wiring, not in how the network call happens.
 */
function createCoreFetch<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType>(
	config: BaseEndpointConfig<TQuery, TBody, TResult>,
) {
	const hasQuery = config.query !== undefined
	const hasBody = config.body !== undefined

	return async (args: Args<TQuery, TBody>, signal?: AbortSignal): Promise<z.output<TResult>> => {
		const { query: rawQuery, body: rawBody } = splitArgs(args, hasQuery, hasBody)

		const query = config.query
			? (parseOrThrow(config.query, rawQuery, 'query', config.url) as Record<string, unknown>)
			: undefined
		const body = config.body ? parseOrThrow(config.body, rawBody, 'body', config.url) : undefined

		const json = await requestJson({
			client: config.client,
			method: config.method,
			url: config.url,
			query,
			body,
			signal,
		})

		return parseOrThrow(config.result, json, 'response', config.url) as z.output<TResult>
	}
}

/* -------------------------------------------------------------------------- */
/*  Query endpoints                                                            */
/* -------------------------------------------------------------------------- */

export interface QueryEndpointConfig<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType>
	extends BaseEndpointConfig<TQuery, TBody, TResult> {
	type: 'query'
	/** Builds the React Query key from the call args. Defaults to `[url, args ?? null]`. */
	queryKey?: (args: Args<TQuery, TBody>) => QueryKey
}

type QueryOptionsOverrides<TResult extends ZodType = ZodType> = Omit<
	UseQueryOptions<z.output<TResult>, Error, z.output<TResult>, QueryKey>,
	'queryKey' | 'queryFn'
>

export interface QueryEndpoint<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType> {
	type: 'query'
	method: HttpMethod
	fetch: (args: Args<TQuery, TBody>, signal?: AbortSignal) => Promise<z.output<TResult>>
	/**
	 * Branded with the result type (see `TaggedQueryKey`) so
	 * `queryClient.getQueryData(endpoint.queryKey(args))` /
	 * `.setQueryData(...)` infer `z.output<TResult>` instead of `unknown` —
	 * the same DX the `queryOptions()` helper provides, without calling it.
	 */
	queryKey: (args: Args<TQuery, TBody>) => TaggedQueryKey<z.output<TResult>>
	/** Ready-to-spread options for `useQuery` / `useSuspenseQuery` / `queryClient.prefetchQuery`, etc. */
	queryOptions: (
		args: Args<TQuery, TBody>,
		overrides?: QueryOptionsOverrides<TResult>,
	) => UseQueryOptions<z.output<TResult>, Error, z.output<TResult>, QueryKey>
}

function createQueryEndpoint<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType>(
	config: QueryEndpointConfig<TQuery, TBody, TResult>,
): QueryEndpoint<TQuery, TBody, TResult> {
	const coreFetch = createCoreFetch(config)
	const buildKey = (config.queryKey ?? ((args: Args<TQuery, TBody>) => [config.url, args ?? null])) as (
		args: Args<TQuery, TBody>,
	) => TaggedQueryKey<z.output<TResult>>

	return {
		type: 'query',
		method: config.method,
		fetch: coreFetch,
		queryKey: buildKey,
		queryOptions: (args, overrides) => ({
			queryKey: buildKey(args),
			queryFn: ({ signal }: { signal: AbortSignal }) => coreFetch(args, signal),
			...overrides,
		}),
	}
}

/* -------------------------------------------------------------------------- */
/*  Mutation endpoints                                                        */
/* -------------------------------------------------------------------------- */

/** A query key, a bare feature/resource string (auto-wrapped as `[string]`), or a resolver function. */
export type InvalidateTarget<TArgs, TResult> =
	| string
	| QueryKey
	| ((args: TArgs, result: TResult) => string | QueryKey)

export interface MutationEndpointConfig<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType>
	extends BaseEndpointConfig<TQuery, TBody, TResult> {
	type: 'mutation'
	/** Query keys to invalidate after a successful mutation. */
	invalidates?: ReadonlyArray<InvalidateTarget<Args<TQuery, TBody>, z.output<TResult>>>
}

type MutationOptionsOverrides<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType> = Omit<
	UseMutationOptions<z.output<TResult>, Error, Args<TQuery, TBody>>,
	'mutationFn'
>

export interface MutationEndpoint<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType> {
	type: 'mutation'
	method: HttpMethod
	fetch: (args: Args<TQuery, TBody>, signal?: AbortSignal) => Promise<z.output<TResult>>
	/** Ready-to-spread options for `useMutation`. */
	mutationOptions: (
		overrides?: MutationOptionsOverrides<TQuery, TBody, TResult>,
	) => UseMutationOptions<z.output<TResult>, Error, Args<TQuery, TBody>>
}

function toQueryKey(target: string | QueryKey): QueryKey {
	return typeof target === 'string' ? [target] : target
}

function createMutationEndpoint<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType>(
	config: MutationEndpointConfig<TQuery, TBody, TResult>,
): MutationEndpoint<TQuery, TBody, TResult> {
	const coreFetch = createCoreFetch(config)

	const fetchImpl = async (args: Args<TQuery, TBody>, signal?: AbortSignal): Promise<z.output<TResult>> => {
		const result = await coreFetch(args, signal)

		if (config.invalidates?.length) {
			await Promise.all(
				config.invalidates.map((target) => {
					const resolved = typeof target === 'function' ? target(args, result) : target
					return queryClient.invalidateQueries({ queryKey: toQueryKey(resolved) })
				}),
			)
		}

		return result
	}

	return {
		type: 'mutation',
		method: config.method,
		fetch: fetchImpl,
		mutationOptions: (overrides) => ({
			mutationFn: (args: Args<TQuery, TBody>) => fetchImpl(args),
			...overrides,
		}),
	}
}

/* -------------------------------------------------------------------------- */
/*  Public factory                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Defines a single endpoint. Which React Query primitive it becomes
 * (`query` vs `mutation`) is controlled purely by `config.type` — completely
 * independent of `config.method`. This is what lets a `post` search-by-body
 * endpoint be a `query`, or a `get`/`delete` cleanup endpoint be a
 * `mutation`, matching real patterns already used across this codebase
 * (e.g. `POST .../summary/remove` acting as a delete).
 *
 * Prefer the `defineQuery` / `defineMutation` sugar below for the common
 * case — use `defineEndpoint` directly only when `type` needs to be
 * decided dynamically.
 */
export function defineEndpoint<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType>(
	config: QueryEndpointConfig<TQuery, TBody, TResult>,
): QueryEndpoint<TQuery, TBody, TResult>
export function defineEndpoint<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType>(
	config: MutationEndpointConfig<TQuery, TBody, TResult>,
): MutationEndpoint<TQuery, TBody, TResult>
export function defineEndpoint<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType>(
	config: QueryEndpointConfig<TQuery, TBody, TResult> | MutationEndpointConfig<TQuery, TBody, TResult>,
): QueryEndpoint<TQuery, TBody, TResult> | MutationEndpoint<TQuery, TBody, TResult> {
	return config.type === 'query' ? createQueryEndpoint(config) : createMutationEndpoint(config)
}

/** Sugar for `defineEndpoint({ ...config, type: 'query' })` — the common case. */
export function defineQuery<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType>(
	config: Omit<QueryEndpointConfig<TQuery, TBody, TResult>, 'type'>,
): QueryEndpoint<TQuery, TBody, TResult> {
	return createQueryEndpoint({ ...config, type: 'query' })
}

/** Sugar for `defineEndpoint({ ...config, type: 'mutation' })` — the common case. */
export function defineMutation<TQuery extends MaybeSchema = undefined, TBody extends MaybeSchema = undefined, TResult extends ZodType = ZodType>(
	config: Omit<MutationEndpointConfig<TQuery, TBody, TResult>, 'type'>,
): MutationEndpoint<TQuery, TBody, TResult> {
	return createMutationEndpoint({ ...config, type: 'mutation' })
}

export type { Input }
