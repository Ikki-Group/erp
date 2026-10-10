import { Elysia } from 'elysia'

import { effectivePermissions, requirePermission } from '@/shared/auth/permission.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import { ForbiddenError, UnauthorizedError } from '@/shared/errors/http-error.ts'

import { getUserAccess } from './access.ts'
import { resolveSession, sessionIdOf } from './session.ts'

const LOCATION_HEADER = 'x-location-id'

type Headers = Record<string, string | undefined>

async function authenticate(headers: Headers): Promise<AuthContext> {
	const header = headers['authorization']
	const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
	if (!token) throw new UnauthorizedError('Authorization header missing')

	const locationId = parseLocationHeader(headers[LOCATION_HEADER])
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
	}
}

function parseLocationHeader(raw: string | undefined): number | null {
	if (raw === undefined || raw === '') return null
	const id = Number(raw)
	if (!Number.isInteger(id) || id <= 0) {
		throw new ForbiddenError('Invalid location header', { code: 'INVALID_LOCATION_HEADER' })
	}
	return id
}

/**
 * Route guard. `{ permission: 'location.read' }` authenticates the request,
 * enforces the permission, and exposes a typed `auth` to the handler. Routes
 * without the option are public.
 */
export const authGuard = new Elysia({ name: 'auth-guard' }).macro({
	permission: (required: string) => ({
		async resolve({ headers }) {
			const auth = await authenticate(headers)
			requirePermission(auth, required)
			return { auth }
		},
	}),
})
