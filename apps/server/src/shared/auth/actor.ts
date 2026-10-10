import type { AuthContext } from './permission.ts'

export interface Actor {
	id: number
	name: string
	locationId: number | null
	/**
	 * Throws 403 unless the current route's permission holds at `locationId`.
	 * Services call it with an existing document's location before acting on it,
	 * so an id from another location can't be read or changed.
	 */
	assertCan(locationId: number | null): void
	/**
	 * Locations where the route's permission holds; null = everywhere. Lists that
	 * span locations filter to these.
	 */
	allowedLocations(): number[] | null
}

export function actorOf(auth: AuthContext): Actor {
	return {
		id: auth.userId,
		name: auth.userName,
		locationId: auth.locationId,
		assertCan: (locationId) => auth.assertCan(locationId),
		allowedLocations: () => auth.allowedLocations(),
	}
}
