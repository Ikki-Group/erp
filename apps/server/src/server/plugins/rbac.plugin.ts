import { Elysia } from 'elysia'

import { actorFor } from '@/shared/auth/actor.ts'
import { assertCan } from '@/shared/auth/permission.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import { ForbiddenError } from '@/shared/errors/http-error.ts'

import { authPlugin } from './auth.plugin.ts'

/** Request fields that name the location(s) an operation reads or writes. */
const LOCATION_FIELDS = ['locationId', 'fromLocationId', 'toLocationId'] as const

function parseLocationId(raw: unknown): number | null {
	if (raw === undefined || raw === null || raw === '') return null
	const id = Number(raw)
	if (!Number.isInteger(id) || id <= 0) {
		throw new ForbiddenError('Invalid location', { code: 'INVALID_LOCATION' })
	}
	return id
}

/** Every location the request names at the top level of its query or body. */
function namedLocations(...sources: unknown[]): Set<number> {
	const ids = new Set<number>()
	for (const source of sources) {
		if (typeof source !== 'object' || source === null) continue
		for (const field of LOCATION_FIELDS) {
			const id = field in source ? parseLocationId(Reflect.get(source, field)) : null
			if (id !== null) ids.add(id)
		}
	}
	return ids
}

/**
 * Route guard. `{ permission: 'stock.read' }` authorizes the request and exposes
 * an `actor` bound to that permission:
 *
 * - When the query/body names locations (`locationId`, `fromLocationId`,
 *   `toLocationId`), the permission must hold at **each** of them; the header
 *   never widens access.
 * - Otherwise it must hold at the active location (`x-location-id`; none =
 *   global grants only).
 * - Records loaded by id are checked in the service against their own location
 *   (`actor.assertCan(doc.locationId)`); lists filter to `actor.allowedLocations()`.
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
				const named = namedLocations(query, body)
				if (named.size === 0) assertCan(auth, required, auth.locationId)
				for (const locationId of named) assertCan(auth, required, locationId)
				return { actor: actorFor(auth, required) }
			},
		}
	},
})
