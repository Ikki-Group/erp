import { Elysia } from 'elysia'

import { AUTH_UTILITY_PERMISSIONS, effectivePermissions } from '@/shared/auth/permission.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import { ForbiddenError, UnauthorizedError } from '@/shared/errors/http-error.ts'

import { getUserAccess } from './access.ts'
import type { UserAccess } from './access.ts'
import { resolveSession, sessionIdOf } from './session.ts'

const LOCATION_HEADER = 'x-location-id'
/** Request fields that name the location(s) an operation reads or writes. */
const LOCATION_FIELDS = ['locationId', 'fromLocationId', 'toLocationId'] as const

type Headers = Record<string, string | undefined>

function grants(access: UserAccess, permission: string, locationId: number | null): boolean {
	return (
		access.isOwner ||
		AUTH_UTILITY_PERMISSIONS.has(permission) ||
		effectivePermissions(access, locationId).includes(permission)
	)
}

function denied(required: string, locationId: number | null): ForbiddenError {
	return new ForbiddenError('Insufficient permissions', {
		code: 'PERMISSION_DENIED',
		context: { required, locationId },
	})
}

async function authenticate(headers: Headers, required: string): Promise<AuthContext> {
	const header = headers['authorization']
	const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
	if (!token) throw new UnauthorizedError('Authorization header missing')

	const locationId = parseLocationId(headers[LOCATION_HEADER])
	const session = await resolveSession(sessionIdOf(token))
	const access = await getUserAccess(session.userId)

	const canUseLocation =
		locationId === null ||
		access.isOwner ||
		access.hasGlobalAssignment ||
		access.access[String(locationId)] !== undefined
	if (!canUseLocation) {
		throw new ForbiddenError('Location access denied', {
			code: 'LOCATION_ACCESS_DENIED',
			context: { locationId },
		})
	}

	return {
		sessionId: session.id,
		userId: session.userId,
		userName: access.userName,
		locationId,
		isOwner: access.isOwner,
		globalPermissions: access.globalPermissions,
		access: access.access,
		permissions: effectivePermissions(access, locationId),
		can: (permission, at) => grants(access, permission, at),
		assertCan: (at) => {
			if (!grants(access, required, at)) throw denied(required, at)
		},
		allowedLocations: () =>
			grants(access, required, null)
				? null
				: Object.keys(access.access)
						.map(Number)
						.filter((id) => grants(access, required, id)),
	}
}

function parseLocationId(raw: unknown): number | null {
	if (raw === undefined || raw === null || raw === '') return null
	const id = Number(raw)
	if (!Number.isInteger(id) || id <= 0) {
		throw new ForbiddenError('Invalid location', { code: 'INVALID_LOCATION' })
	}
	return id
}

/** Every location the request names in its query or body (e.g. `?locationId=2`). */
function targetedLocations(...sources: unknown[]): number[] {
	const ids = new Set<number>()
	for (const source of sources) {
		if (typeof source !== 'object' || source === null) continue
		for (const field of LOCATION_FIELDS) {
			const id = field in source ? parseLocationId(Reflect.get(source, field)) : null
			if (id !== null) ids.add(id)
		}
	}
	return [...ids]
}

/**
 * Route guard. `{ permission: 'stock.read' }` authenticates and authorizes:
 *
 * - When the request names locations (`locationId`, `fromLocationId`,
 *   `toLocationId` in query or body), the permission must hold at **each** of
 *   them — the header alone never widens access.
 * - Otherwise it must hold at the active location (`x-location-id`; none =
 *   global permissions only).
 * - Operations on an existing document check its own location in the service
 *   with `actor.assertCan(doc.locationId)`.
 *
 * `{ anyLocationPermission: 'stock.read' }` passes when the user holds the
 * permission at any location; the handler must then scope its result with
 * `auth.can(permission, locationId)`.
 *
 * Routes with neither option are public.
 */
export const authGuard = new Elysia({ name: 'auth-guard' }).macro({
	permission: (required: string) => ({
		async resolve({ headers, query, body }) {
			const auth = await authenticate(headers, required)
			const targets = targetedLocations(query, body)
			if (targets.length === 0) auth.assertCan(auth.locationId)
			for (const id of targets) auth.assertCan(id)
			return { auth }
		},
	}),
	anyLocationPermission: (required: string) => ({
		async resolve({ headers }) {
			const auth = await authenticate(headers, required)
			const anywhere =
				auth.can(required, null) ||
				Object.keys(auth.access).some((id) => auth.can(required, Number(id)))
			if (!anywhere) throw denied(required, null)
			return { auth }
		},
	}),
})
