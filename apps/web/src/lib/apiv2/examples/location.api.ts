/**
 * apiv2 demo — LOCATION feature.
 *
 * This file demonstrates the apiv2 pattern only. It is NOT wired into any
 * real route/component and does not replace
 * `@/features/location/location.api.ts`. It imports the real DTOs from the
 * `location` feature (read-only) to prove the pattern compiles and behaves
 * correctly against actual production schemas.
 *
 * Do not import this file from application code.
 */
import { endpoint } from '@/config/endpoint'

import { createSuccessResponseSchema } from '@/lib/validation'

import {
	LocationCreateDto,
	LocationDto,
	LocationFilterDto,
	LocationUpdateDto,
} from '@/features/location/location.dto'

import { defineMutation, defineQuery } from '../endpoint'
import { defineResource } from '../resource'

/**
 * Standard CRUD, built with `defineResource` sugar. `urls` comes straight
 * from the centralized, generated `@/config/endpoint` registry.
 *
 * Usage in a component:
 *
 * ```tsx
 * // GET — query
 * const { data } = useQuery(locationApiV2.list.queryOptions({ page: 1, limit: 10 }))
 *
 * // GET — query with a param (bare arg, since `detail` only has a `query` schema)
 * const { data: detail } = useQuery(locationApiV2.detail.queryOptions({ id: 1 }))
 *
 * // POST — mutation, auto-invalidates the `list` query key on success
 * const { mutate } = useMutation(locationApiV2.create.mutationOptions({
 *   onSuccess: () => toast.success('Location created'),
 * }))
 * mutate({ code: 'WH-1', name: 'Warehouse 1', type: 'warehouse', ... })
 *
 * // DELETE — mutation
 * const { mutate: remove } = useMutation(locationApiV2.remove.mutationOptions())
 * remove({ id: 1 })
 * ```
 */
export const locationApiV2 = defineResource({
	urls: endpoint.location,
	entitySchema: LocationDto,
	filter: LocationFilterDto,
	create: LocationCreateDto,
	update: LocationUpdateDto,
})

/**
 * Example of a one-off, non-CRUD endpoint defined directly with
 * `defineQuery` (bypassing the `defineResource` sugar) — a lightweight
 * "detail by code" lookup reusing `LocationDto` with a custom query key.
 */
export const locationDetailByCode = defineQuery({
	method: 'get',
	url: endpoint.location.detail,
	query: LocationFilterDto.pick({ q: true }),
	result: createSuccessResponseSchema(LocationDto),
	queryKey: (query) => ['location', 'location', 'by-code', query?.q ?? null] as const,
})

/**
 * KEY IMPROVEMENT OVER THE OLD DESIGN — proof that `type` (query vs.
 * mutation) is fully decoupled from `method`. Neither of these would be
 * expressible in the old `defineEndpoint`, where the method alone decided
 * the React Query classification (`method: 'get'` ⇒ query, anything else
 * ⇒ mutation).
 */

/**
 * A `POST` endpoint classified as a `query`. Searching by a large/complex
 * filter is sometimes sent as a body instead of a query string (to avoid
 * URL length limits or to support nested filter shapes) — this is still
 * conceptually a read, so it should behave like one in React Query
 * (cached, deduped, refetched on window focus, etc).
 */
export const locationSearch = defineQuery({
	method: 'post',
	url: endpoint.location.list,
	body: LocationFilterDto,
	result: createSuccessResponseSchema(LocationDto.array()),
	queryKey: (body) => ['location', 'location', 'search', body ?? null] as const,
})

/**
 * A `GET` endpoint classified as a `mutation`. Some "trigger an action"
 * endpoints are implemented as idempotent `GET`s server-side (e.g. a
 * cache-warming or export-generation endpoint) but are semantically a
 * mutation from the client's point of view — the caller wants a manual
 * `mutate()` trigger, loading/error state via `useMutation`, and cache
 * invalidation on success, not automatic background refetching.
 */
export const locationResyncCache = defineMutation({
	method: 'get',
	url: endpoint.location.list,
	result: createSuccessResponseSchema(LocationDto.array()),
	invalidates: [locationApiV2.keys.lists()],
})

/**
 * CROSS-FEATURE INVALIDATION, WITHOUT CYCLIC IMPORTS.
 *
 * `locationApiV2.list`/`.detail` key their cache on their own endpoint URL
 * (`[endpoint.location.list, args ?? null]`), not on a separate
 * feature/entity name. That means a completely unrelated feature — say
 * `inventory.api.ts` — can invalidate the location list after, e.g.,
 * transferring stock between locations, using *only* the raw URL string
 * from the shared `@/config/endpoint` registry:
 *
 * ```ts
 * // inventory.api.ts — does NOT import location.api.ts's resource/keys,
 * // just the shared, dependency-free `endpoint` registry
 * import { endpoint } from '@/config/endpoint'
 *
 * export const transferStock = defineMutation({
 *   method: 'post',
 *   url: endpoint.inventory.transaction.transfer,
 *   body: TransferStockDto,
 *   result: createSuccessResponseSchema(zc.RecordId),
 *   invalidates: [endpoint.location.list], // bare URL string, prefix-matches every `list` variant
 * })
 * ```
 *
 * Since `endpoint` has no dependencies of its own, importing it never
 * creates a cycle no matter how many features do it. Prefer this over
 * importing another feature's `keys`/resource object for invalidation;
 * reserve direct object access (`locationApiV2.keys...`) for
 * same-file/same-feature use, as above.
 */
