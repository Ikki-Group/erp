import type { z } from 'zod'

/**
 * Contract-driven route metadata.
 *
 * A module declares its HTTP surface ONCE via `defineContract`. This single
 * source is used two ways:
 *
 *  1. The server builds Elysia routes from it (method + path + input/output
 *     Zod schemas), so the wire contract is guaranteed to match the schemas.
 *  2. The web codegen reads it (see `scripts/generate-web.ts`) to emit the
 *     endpoint config, the copied DTO module, and the typed api-factory calls
 *     — no regex parsing, no hand-duplicated method/DTO declarations.
 *
 * The generator needs the *names* of the schemas (to emit imports and factory
 * references), which cannot be recovered from a Zod object at runtime. So each
 * endpoint records `inputRef` / `outputRef` — the identifier as written in the
 * contract file — alongside the live schema used by the server.
 */

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/** How the input schema is carried over the wire. */
export type InputKind = 'query' | 'body'

/** How the output schema is wrapped in the standard response envelope. */
export type OutputKind = 'single' | 'paginated'

/** A reference to a Zod schema plus the identifier it is exported/known as. */
export interface SchemaRef<T extends z.ZodType = z.ZodType> {
	/** The live Zod schema (used by the server to validate). */
	schema: T
	/**
	 * The identifier the generator should emit on the web side.
	 *
	 * - For a DTO exported from the contract, this is the export name
	 *   (e.g. `'LocationFilterDto'`).
	 * - For a shared primitive, use `zc.RecordId` style refs via {@link ref}
	 *   with `from: 'validation'` (e.g. `'zc.RecordId'`).
	 */
	ref: string
	/** Where the generator imports the ref from. Default: local DTO barrel. */
	from?: 'dto' | 'validation'
}

export interface EndpointContract<
	TInput extends z.ZodType | undefined = z.ZodType | undefined,
	TOutput extends z.ZodType = z.ZodType,
> {
	/** Action key. Becomes the endpoint config key and api-factory key. */
	action: string
	method: HttpMethod
	/** Path relative to the module prefix, e.g. `/list`. */
	path: string
	/** Whether the endpoint requires authentication. Default true. */
	auth?: boolean
	/** Input schema + how it is carried. Omit for input-less endpoints. */
	input?: {
		kind: InputKind
		ref: SchemaRef<NonNullable<TInput>>
	}
	/** Output data schema + how it is wrapped. */
	output: {
		kind: OutputKind
		ref: SchemaRef<TOutput>
	}
	/** Optional Swagger tags forwarded to the Elysia route detail. */
	tags?: string[]
}

export interface ModuleContract {
	/**
	 * Web feature = the `features/<feature>` folder AND the endpoint-config
	 * namespace. e.g. `'location'`, `'iam'`, `'payment'`.
	 */
	feature: string
	/**
	 * Entity within the feature. Drives the flat file basenames
	 * (`<entity>.dto.ts`, `<entity>.api.ts`), the exported `<entity>Api` object,
	 * and the query-key resource. For a single-entity feature this equals
	 * `feature` (e.g. location → `entity: 'location'`). For a multi-entity
	 * feature it is the sub-entity (e.g. feature `iam`, entity `user`).
	 */
	entity: string
	/** Elysia route prefix, e.g. `/location` or `/iam/user`. */
	prefix: string
	/**
	 * Path to the server contract file that exports the DTOs, relative to
	 * `apps/server/src/modules`. Used by the generator to copy DTOs to web.
	 * e.g. `'location/location.contract.ts'`.
	 */
	dtoSource: string
	endpoints: EndpointContract[]
}

/** Build a {@link SchemaRef} for a DTO exported from the contract file. */
export function dto<T extends z.ZodType>(schema: T, ref: string): SchemaRef<T> {
	return { schema, ref, from: 'dto' }
}

/** Build a {@link SchemaRef} for a shared validation primitive (zc/zp/zq). */
export function shared<T extends z.ZodType>(schema: T, ref: string): SchemaRef<T> {
	return { schema, ref, from: 'validation' }
}

/**
 * Declare a module's HTTP contract. Returns the descriptor unchanged (identity)
 * but with a precise type so both the route builder and the generator get full
 * inference.
 */
export function defineContract<const C extends ModuleContract>(contract: C): C {
	return contract
}

/** Declare a single endpoint. Identity helper for inference + readability. */
export function endpoint<
	const TInput extends z.ZodType | undefined,
	const TOutput extends z.ZodType,
>(e: EndpointContract<TInput, TOutput>): EndpointContract<TInput, TOutput> {
	return e
}
