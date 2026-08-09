import type { DataTag } from '@tanstack/react-query'

import type { z, ZodType } from 'zod'

/** HTTP verbs supported by the endpoint factory. */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/**
 * React Query classification of an endpoint. Deliberately independent of
 * `HttpMethod` — a `post` can be a `query` (e.g. search-by-body) and a
 * `get`/`post`/`delete` can all be a `mutation`. See `endpoint.ts`.
 */
export type EndpointKind = 'query' | 'mutation'

/** React Query query key shape used across the API layer. */
export type QueryKey = readonly unknown[]

/**
 * A `QueryKey` branded with the data/error type it resolves to. This lets
 * `queryClient.getQueryData(endpoint.queryKey(args))` infer `TValue`
 * instead of `unknown`.
 */
export type TaggedQueryKey<TValue> = DataTag<QueryKey, TValue, Error>

/** A Zod schema, or `undefined` when that input slot is unused. */
export type MaybeSchema = ZodType | undefined

/** Infers the *input* (pre-parse) type of a schema slot, or `undefined` when unused. */
export type Input<T extends MaybeSchema> = T extends ZodType ? z.input<T> : undefined

/** Infers the *output* (post-parse) type of a schema slot, or `undefined` when unused. */
export type Output<T extends MaybeSchema> = T extends ZodType ? z.output<T> : undefined

/**
 * The public argument shape an endpoint accepts, derived from which of
 * `query`/`body` schemas are configured:
 *
 * - neither configured → `undefined` (call with no args)
 * - only one configured → that schema's input, passed bare (no wrapper)
 * - both configured     → `{ query, body }`
 */
export type Args<
	TQuery extends MaybeSchema = undefined,
	TBody extends MaybeSchema = undefined,
> = TQuery extends ZodType
	? TBody extends ZodType
		? { query: Input<TQuery>; body: Input<TBody> }
		: Input<TQuery>
	: TBody extends ZodType
		? Input<TBody>
		: undefined
