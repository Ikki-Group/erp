import { Elysia } from 'elysia'

import { actorFor } from '@/shared/auth/actor.ts'
import { assertCan } from '@/shared/auth/permission.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import { ForbiddenError } from '@/shared/errors/http-error.ts'

import { authPlugin } from './auth.plugin.ts'

/** The top-level `locationId` of a query or body, if it names one. */
function locationIdOf(source: unknown): number | null {
	if (typeof source !== 'object' || source === null || !('locationId' in source)) return null
	const raw = source.locationId
	if (raw === undefined || raw === null || raw === '') return null
	const id = Number(raw)
	if (!Number.isInteger(id) || id <= 0) {
		throw new ForbiddenError('Invalid location', { code: 'INVALID_LOCATION' })
	}
	return id
}

/**
 * Route guard. `{ permission: 'stock.read' }` authorizes the request and exposes
 * an `actor` bound to that permission:
 *
 * - When the query and/or body name a `locationId`, the permission must hold
 *   at each; the header never widens access.
 * - Otherwise it must hold at the active location (`x-location-id`; none =
 *   global grants only).
 * - Everything else is the service's job: records loaded by id are checked
 *   against their own location (`actor.assertCan(doc.locationId)`), lists filter
 *   to `actor.allowedLocations()`, and multi-location operations assert the side
 *   that acts (a transfer is created and shipped at its source, received at its
 *   destination).
 */
export const rbac = new Elysia({ name: 'rbac' }).use(authPlugin).macro({
	permission(required: string) {
		return {
			resolve(context) {
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Elysia 1.4 omits scoped derive fields from macro context types; authPlugin supplies `auth` at runtime.
				const { auth, query, body } = context as unknown as {
					auth: AuthContext
					query: unknown
					body: unknown
				}
				const named = [locationIdOf(query), locationIdOf(body)].filter((id) => id !== null)
				for (const locationId of named.length > 0 ? named : [auth.locationId]) {
					assertCan(auth, required, locationId)
				}
				return { actor: actorFor(auth, required) }
			},
		}
	},
})
