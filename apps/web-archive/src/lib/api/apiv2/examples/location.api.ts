/**
 * apiv2 pilot / sandbox demo — LOCATION feature.
 *
 * This file is a demonstration of the apiv2 pattern only. It is NOT wired
 * into any real route/component and does not replace
 * `@/features/location/location.api.ts`. It imports the real DTOs from
 * the `location` feature (read-only) to prove the pattern compiles and
 * behaves correctly against actual production schemas.
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

import { defineEndpoint } from '../define-endpoint'
import { defineResource } from '../define-resource'

/**
 * Standard CRUD, built with `defineResource` sugar.
 *
 * Notice each endpoint below only exposes what makes sense for its method:
 *   - `locationApiV2.list` / `.detail` → `.queryOptions()` (no mutationOptions)
 *   - `locationApiV2.create` / `.update` / `.remove` → `.mutationOptions()` (no queryOptions)
 *
 * Usage in a component:
 *
 * ```tsx
 * // GET — query
 * const { data } = useQuery(locationApiV2.list.queryOptions({ page: 1, limit: 10 }))
 *
 * // GET — query with a param
 * const { data: detail } = useQuery(locationApiV2.detail.queryOptions({ id: 1 }))
 *
 * // POST — mutation, auto-invalidates the `list` query key on success
 * const { mutate } = useMutation(locationApiV2.create.mutationOptions({
 *   onSuccess: () => toast.success('Location created'),
 * }))
 * mutate({ body: { code: 'WH-1', name: 'Warehouse 1', type: 'warehouse', ... } })
 *
 * // DELETE — mutation
 * const { mutate: remove } = useMutation(locationApiV2.remove.mutationOptions())
 * remove({ query: { id: 1 } })
 * ```
 */
export const locationApiV2 = defineResource({
	feature: 'location',
	entity: 'location',
	urls: endpoint.location,
	entitySchema: LocationDto,
	filter: LocationFilterDto,
	create: LocationCreateDto,
	update: LocationUpdateDto,
})

/**
 * Example of a one-off, non-CRUD endpoint defined directly with
 * `defineEndpoint` (bypassing the `defineResource` sugar) — e.g. a
 * lightweight "detail without the paginated envelope" endpoint that
 * reuses the same `LocationDto`/query convention but a custom query key.
 */
export const locationDetailByCode = defineEndpoint({
	method: 'get',
	url: endpoint.location.detail,
	query: LocationFilterDto.pick({ q: true }),
	result: createSuccessResponseSchema(LocationDto),
	queryKey: (query) => ['location', 'location', 'by-code', query?.q ?? null] as const,
})
