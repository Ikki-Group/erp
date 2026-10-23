import type { AuthLocation, MeResponse } from '@/features/auth/dto/index.ts'

export interface LocationAccess {
	location: AuthLocation
	roles: string[]
}

export interface AccessSummary {
	/** Roles assigned company-wide (no location). */
	globalRoles: string[]
	locations: LocationAccess[]
}

/** Groups the caller's role assignments by the locations they can reach. */
export function summarizeAccess(
	locations: readonly AuthLocation[],
	assignments: MeResponse['user']['assignments'],
): AccessSummary {
	const globalRoles = assignments.filter((a) => a.locationId === null).map((a) => a.role.name)
	return {
		globalRoles,
		locations: locations.map((location) => ({
			location,
			// A global role applies everywhere, so it is listed on each location too.
			roles: [
				...new Set([
					...assignments.filter((a) => a.locationId === location.id).map((a) => a.role.name),
					...globalRoles,
				]),
			],
		})),
	}
}
