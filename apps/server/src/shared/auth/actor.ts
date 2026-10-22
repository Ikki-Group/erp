import { allowedLocations, assertCan, can } from './permission.ts'
import type { AuthContext } from './permission.ts'

/**
 * The user acting on a request, bound to the route's permission. Services use it
 * to stamp audit fields and to authorize against a document's own location:
 * the route guard only sees the locations a request names, not the location of
 * a record loaded by id.
 */
export interface Actor {
	id: number
	name: string
	/** Active location (`x-location-id`), recorded on audit entries. */
	locationId: number | null
	/** Whether `permission` (default: the route's) holds at `locationId`. */
	can(locationId: number | null, permission?: string): boolean
	/** Throws 403 unless `permission` (default: the route's) holds at `locationId`. */
	assertCan(locationId: number | null, permission?: string): void
	/** Locations where `permission` (default: the route's) holds; null = all. */
	allowedLocations(permission?: string): number[] | null
}

export function actorFor(auth: AuthContext, routePermission: string): Actor {
	return {
		id: auth.userId,
		name: auth.userName,
		locationId: auth.locationId,
		can: (locationId, permission = routePermission) => can(auth, permission, locationId),
		assertCan: (locationId, permission = routePermission) =>
			assertCan(auth, permission, locationId),
		allowedLocations: (permission = routePermission) => allowedLocations(auth, permission),
	}
}
