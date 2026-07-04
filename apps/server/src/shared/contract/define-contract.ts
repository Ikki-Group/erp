import type { z } from 'zod'

/**
 * Contract-driven route metadata — the single source of truth for a module's
 * HTTP surface. Authored once per module; consumed two ways:
 *
 *  1. (future) The server builds Elysia routes from it.
 *  2. The web codegen (`scripts/generate-web.ts`) emits the endpoint config,
 *     the copied DTO module, and the typed api-factory calls.
 *
 * ## Authoring (terse)
 *
 * ```ts
 * export const locationContract = defineContract({
 *   feature: 'location',
 *   entity: 'location',
 *   prefix: '/location',
 *   dtoSource: 'location/location.contract.ts',
 *   dtos: { LocationDto, LocationFilterDto, LocationCreateDto, LocationUpdateDto },
 *   endpoints: {
 *     list:   { get: '/list',    query: LocationFilterDto, ok: [LocationDto] }, // [X] = paginated
 *     detail: { get: '/detail',  query: zc.RecordId,       ok: LocationDto },
 *     create: { post: '/create', body: LocationCreateDto,  ok: zc.RecordId },
 *     update: { put: '/update',  body: LocationUpdateDto,  ok: zc.RecordId },
 *     remove: { delete: '/remove', body: zc.RecordId,      ok: zc.RecordId },
 *   },
 * })
 * ```
 *
 * - The HTTP method is the *key* of the endpoint object (`get`/`post`/…), whose
 *   value is the path.
 * - `query` / `body` = input schema (kind inferred from which key is present).
 * - `ok` = success output schema; wrap in `[ ]` for a paginated list.
 * - `dtos` maps every DTO the codegen must import → its exported identifier is
 *   recovered by matching the schema object identity (no name written twice).
 *   Schemas NOT in `dtos` (e.g. `zc.RecordId`) are treated as shared validation
 *   primitives and imported from `@/lib/validation`.
 */

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/** A single endpoint: one method key → path, plus input/output schemas. */
export type EndpointDef =
	& { [M in HttpMethod]?: string }
	& {
		/** Query input schema (GET-style). Mutually exclusive with `body`. */
		query?: z.ZodType
		/** Body input schema (mutation). Mutually exclusive with `query`. */
		body?: z.ZodType
		/** Success output. Wrap in `[schema]` for a paginated list response. */
		ok: z.ZodType | [z.ZodType]
		/** Whether the endpoint requires auth. Default true. */
		auth?: boolean
		/** Optional Swagger tags. */
		tags?: string[]
	}

export interface ModuleContract {
	/** `features/<feature>` folder + endpoint-config namespace. */
	feature: string
	/**
	 * Entity within the feature (file basename, `<entity>Api`, query-key
	 * resource). Equals `feature` for a single-entity feature.
	 */
	entity: string
	/** Elysia route prefix, e.g. `/location` or `/iam/user`. */
	prefix: string
	/**
	 * Contract file path(s) relative to `apps/server/src/modules`, whose DTO
	 * definitions are copied to web. Usually the contract's own file; pass an
	 * array to also pull in DTOs defined elsewhere (e.g. a `composed/` file).
	 */
	dtoSource: string | string[]
	/**
	 * DTO registry: identifier → schema. The generator recovers each emitted
	 * name by matching schema identity against this map.
	 */
	dtos: Record<string, z.ZodType>
	/** Endpoints keyed by action name. */
	endpoints: Record<string, EndpointDef>
}

/**
 * Declare a module's HTTP contract. Identity function with precise inference.
 */
export function defineContract<const C extends ModuleContract>(contract: C): C {
	return contract
}
