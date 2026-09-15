import { mockError, mockSuccess } from '../response.ts'
import { registerRoute } from '../router.ts'
import * as session from '../session.ts'

import { endpoint } from '@/config/endpoint.ts'

interface LoginBody {
	username: string
	password: string
}

interface SwitchLocationBody {
	locationId: number
}

function toAuthUser(user: { id: number; username: string; name: string; email: string }) {
	return { id: user.id, username: user.username, name: user.name, email: user.email }
}

function toAuthLocation(loc: { id: number; code: string; name: string; type: string }) {
	return { id: loc.id, code: loc.code, name: loc.name, type: loc.type }
}

registerRoute('post', endpoint.auth.login, (_params, body) => {
	const { username, password } = body as LoginBody
	const user = session.login(username, password)
	if (!user) return mockError(401, 'Username atau password salah.', 'INVALID_CREDENTIALS')

	return mockSuccess({
		user: toAuthUser(user),
		locations: session.accessibleLocations().map(toAuthLocation),
		activeLocationId: session.currentLocation()?.id ?? null,
	})
})

registerRoute('get', endpoint.auth.me, () => {
	const user = session.currentUser()
	if (!user) return mockError(401, 'Sesi tidak ditemukan.', 'UNAUTHENTICATED')

	return mockSuccess({
		user: toAuthUser(user),
		activeLocation: session.currentLocation() ? toAuthLocation(session.currentLocation()!) : null,
		permissions: user.permissions,
		isOwner: user.isOwner,
	})
})

registerRoute('post', endpoint.auth.logout, () => {
	session.logout()
	return mockSuccess(undefined)
})

registerRoute('post', endpoint.auth.switchLocation, (_params, body) => {
	const { locationId } = body as SwitchLocationBody
	const loc = session.switchLocation(locationId)
	if (!loc) return mockError(404, 'Lokasi tidak ditemukan.', 'NOT_FOUND')
	return mockSuccess({ activeLocation: toAuthLocation(loc) })
})
