import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'

import { queryClient } from '@/lib/tanstack-query.ts'

import { getActiveLocationId } from './active-location.ts'
import type { ApiClient } from './client.ts'
import { resolveFreshness } from './freshness.ts'
import type { FreshnessTier } from './freshness.ts'
import { requestJson } from './http.ts'
import type {
	Args,
	EndpointArgs,
	HttpMethod,
	Input,
	MaybeSchema,
	QueryKey,
	TaggedQueryKey,
} from './types.ts'
import { parseOrThrow } from './validate.ts'
import type { z, ZodType } from 'zod'

/* -------------------------------------------------------------------------- */
/*  Shared plumbing                                                            */
/* -------------------------------------------------------------------------- */

/** Splits the public bare-or-wrapped `Args` shape back into `{ query, body }` for the wire. */
function splitArgs(
	args: unknown,
	hasQuery: boolean,
	hasBody: boolean,
): { query?: unknown; body?: unknown } {
	if (hasQuery && hasBody) {
		const wrapped = (args ?? {}) as { query?: unknown; body?: unknown }
		return { query: wrapped.query, body: wrapped.body }
	}
	if (hasQuery) return { query: args }
	if (hasBody) return { body: args }
	return {}
}

interface BaseEndpointConfig<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
> {
	method: HttpMethod
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
 * validate the response.
 */
function createCoreFetch<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
>(config: BaseEndpointConfig<TQuery, TBody, TResult>) {
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

export interface QueryEndpointConfig<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
> extends BaseEndpointConfig<TQuery, TBody, TResult> {
	type: 'query'
	/** Builds the React Query key from the call args. Defaults to `[url, args ?? null]`. */
	queryKey?: (args: Args<TQuery, TBody>) => QueryKey
	/**
	 * Freshness tier controlling `staleTime`/`gcTime`/`refetchInterval`. Defaults
	 * to `'standard'` (the app-wide default). Overrides on `queryOptions` still win.
	 */
	tier?: FreshnessTier
	/**
	 * When true, the active `locationId` is folded into the query key so the
	 * cache partitions per location and location-switch invalidation can target
	 * this endpoint precisely. The `{ loc }` segment is appended to the default
	 * key; a custom `queryKey` is responsible for its own location scoping.
	 */
	locationScoped?: boolean
}

type QueryOptionsOverrides<TResult extends ZodType = ZodType> = Omit<
	UseQueryOptions<z.output<TResult>, Error, z.output<TResult>, QueryKey>,
	'queryKey' | 'queryFn'
>

export interface QueryEndpoint<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
> {
	type: 'query'
	method: HttpMethod
	fetch: (
		...args: [...EndpointArgs<TQuery, TBody>, signal?: AbortSignal]
	) => Promise<z.output<TResult>>
	queryKey: (...args: EndpointArgs<TQuery, TBody>) => TaggedQueryKey<z.output<TResult>>
	queryOptions: (
		...args: [...EndpointArgs<TQuery, TBody>, overrides?: QueryOptionsOverrides<TResult>]
	) => UseQueryOptions<z.output<TResult>, Error, z.output<TResult>, QueryKey>
}

function createQueryEndpoint<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
>(config: QueryEndpointConfig<TQuery, TBody, TResult>): QueryEndpoint<TQuery, TBody, TResult> {
	const coreFetch = createCoreFetch(config)
	const tier = config.tier ?? 'standard'

	// A custom `queryKey` owns its own location scoping — the factory can't fold
	// `{ loc }` into a key it didn't build. Combining both is a silent footgun
	// (unscoped cache that cross-contaminates locations), so reject it up front.
	if (config.locationScoped && config.queryKey) {
		throw new Error(
			`[api] defineQuery(${config.url}): \`locationScoped\` cannot be combined with a custom ` +
				'`queryKey`. Fold the active location into the key yourself (via createResourceKeys ' +
				'or getActiveLocationId), or drop the custom queryKey.',
		)
	}

	const buildKey = (args: Args<TQuery, TBody>): QueryKey => {
		if (config.locationScoped) {
			return [config.url, { loc: getActiveLocationId() }, args ?? null]
		}
		return config.queryKey ? config.queryKey(args) : [config.url, args ?? null]
	}

	return {
		type: 'query',
		method: config.method,
		fetch: ((...callArgs: unknown[]) => {
			// `args` is present only for schema-bearing endpoints; a trailing
			// AbortSignal may follow. No-arg endpoints pass only the signal.
			const [maybeArgs, maybeSignal] = splitCallArgs(callArgs, config)
			return coreFetch(maybeArgs as Args<TQuery, TBody>, maybeSignal)
		}) as QueryEndpoint<TQuery, TBody, TResult>['fetch'],
		queryKey: ((...callArgs: unknown[]) =>
			buildKey(callArgs[0] as Args<TQuery, TBody>)) as unknown as QueryEndpoint<
			TQuery,
			TBody,
			TResult
		>['queryKey'],
		queryOptions: ((...callArgs: unknown[]) => {
			const [args, overrides] = splitArgsAndOverrides(callArgs, config)
			return {
				queryKey: buildKey(args as Args<TQuery, TBody>),
				queryFn: ({ signal }: { signal: AbortSignal }) =>
					coreFetch(args as Args<TQuery, TBody>, signal),
				...resolveFreshness(tier),
				...(overrides as QueryOptionsOverrides<TResult> | undefined),
			}
		}) as QueryEndpoint<TQuery, TBody, TResult>['queryOptions'],
	}
}

/**
 * Splits a variadic call into `[args, signal]`. For a schema-bearing endpoint
 * the first value is the args and an optional `AbortSignal` follows; for a
 * no-arg endpoint only the signal (if any) is passed.
 */
function splitCallArgs(
	callArgs: unknown[],
	config: { query?: unknown; body?: unknown },
): [unknown, AbortSignal | undefined] {
	const hasSchema = config.query !== undefined || config.body !== undefined
	if (hasSchema) return [callArgs[0], callArgs[1] as AbortSignal | undefined]
	return [undefined, callArgs[0] as AbortSignal | undefined]
}

/**
 * Splits a variadic `queryOptions` call into `[args, overrides]`. For a
 * schema-bearing endpoint the first value is the args and the optional
 * overrides object follows; for a no-arg endpoint only the overrides (if any).
 */
function splitArgsAndOverrides(
	callArgs: unknown[],
	config: { query?: unknown; body?: unknown },
): [unknown, unknown] {
	const hasSchema = config.query !== undefined || config.body !== undefined
	if (hasSchema) return [callArgs[0], callArgs[1]]
	return [undefined, callArgs[0]]
}

/* -------------------------------------------------------------------------- */
/*  Mutation endpoints                                                        */
/* -------------------------------------------------------------------------- */

/** A query key, a bare feature/resource string (auto-wrapped as `[string]`), or a resolver function. */
export type InvalidateTarget<TArgs, TResult> =
	| string
	| QueryKey
	| ((args: TArgs, result: TResult) => string | QueryKey)

export interface MutationEndpointConfig<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
> extends BaseEndpointConfig<TQuery, TBody, TResult> {
	type: 'mutation'
	/** Query keys to invalidate after a successful mutation. */
	invalidates?: ReadonlyArray<InvalidateTarget<Args<TQuery, TBody>, z.output<TResult>>>
}

type MutationOptionsOverrides<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
> = Omit<UseMutationOptions<z.output<TResult>, Error, Args<TQuery, TBody>>, 'mutationFn'>

export interface MutationEndpoint<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
> {
	type: 'mutation'
	method: HttpMethod
	fetch: (
		...args: [...EndpointArgs<TQuery, TBody>, signal?: AbortSignal]
	) => Promise<z.output<TResult>>
	mutationOptions: (
		overrides?: MutationOptionsOverrides<TQuery, TBody, TResult>,
	) => UseMutationOptions<z.output<TResult>, Error, Args<TQuery, TBody>>
}

function toQueryKey(target: string | QueryKey): QueryKey {
	return typeof target === 'string' ? [target] : target
}

function createMutationEndpoint<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
>(
	config: MutationEndpointConfig<TQuery, TBody, TResult>,
): MutationEndpoint<TQuery, TBody, TResult> {
	const coreFetch = createCoreFetch(config)

	const fetchImpl = async (
		args: Args<TQuery, TBody>,
		signal?: AbortSignal,
	): Promise<z.output<TResult>> => {
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

	const hasSchema = config.query !== undefined || config.body !== undefined

	return {
		type: 'mutation',
		method: config.method,
		fetch: ((...callArgs: unknown[]) => {
			const args = hasSchema ? callArgs[0] : undefined
			const signal = (hasSchema ? callArgs[1] : callArgs[0]) as AbortSignal | undefined
			return fetchImpl(args as Args<TQuery, TBody>, signal)
		}) as MutationEndpoint<TQuery, TBody, TResult>['fetch'],
		mutationOptions: (overrides) => ({
			mutationFn: (args: Args<TQuery, TBody>) => fetchImpl(args),
			...overrides,
		}),
	}
}

/* -------------------------------------------------------------------------- */
/*  Public factory                                                            */
/* -------------------------------------------------------------------------- */

export function defineEndpoint<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
>(config: QueryEndpointConfig<TQuery, TBody, TResult>): QueryEndpoint<TQuery, TBody, TResult>
export function defineEndpoint<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
>(config: MutationEndpointConfig<TQuery, TBody, TResult>): MutationEndpoint<TQuery, TBody, TResult>
export function defineEndpoint<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
>(
	config:
		| QueryEndpointConfig<TQuery, TBody, TResult>
		| MutationEndpointConfig<TQuery, TBody, TResult>,
): QueryEndpoint<TQuery, TBody, TResult> | MutationEndpoint<TQuery, TBody, TResult> {
	return config.type === 'query' ? createQueryEndpoint(config) : createMutationEndpoint(config)
}

/** Sugar for `defineEndpoint({ ...config, type: 'query' })` — the common case. */
export function defineQuery<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
>(
	config: Omit<QueryEndpointConfig<TQuery, TBody, TResult>, 'type'>,
): QueryEndpoint<TQuery, TBody, TResult> {
	return createQueryEndpoint({ ...config, type: 'query' })
}

/** Sugar for `defineEndpoint({ ...config, type: 'mutation' })` — the common case. */
export function defineMutation<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
	TResult extends ZodType = ZodType,
>(
	config: Omit<MutationEndpointConfig<TQuery, TBody, TResult>, 'type'>,
): MutationEndpoint<TQuery, TBody, TResult> {
	return createMutationEndpoint({ ...config, type: 'mutation' })
}

export type { Input }
