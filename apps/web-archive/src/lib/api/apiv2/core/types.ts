import type { z, ZodType } from 'zod'

/**
 * HTTP methods supported by the endpoint factory.
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/**
 * Mutating methods — everything except `get`.
 * Endpoints declared with one of these methods only ever expose
 * `mutationOptions`, never `queryOptions`.
 */
export type MutationMethod = Exclude<HttpMethod, 'get'>

/**
 * React Query query key shape used across apiv2.
 */
export type QueryKey = readonly unknown[]

/**
 * Infers the *input* (pre-parse) type of a Zod schema, or `undefined`
 * when no schema was provided for that slot.
 */
export type Input<T> = T extends ZodType ? z.input<T> : undefined

/**
 * Infers the *output* (post-parse) type of a Zod schema, or `undefined`
 * when no schema was provided for that slot.
 */
export type Output<T> = T extends ZodType ? z.output<T> : undefined
