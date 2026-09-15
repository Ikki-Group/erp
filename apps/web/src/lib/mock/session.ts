import { mockUsers } from './fixtures/auth.ts'
import { mockLocationSeed } from './fixtures/location.ts'

/**
 * Mock "session" — module-level state standing in for the server's cookie
 * session. Resets on full page reload, matching how a prototype build is
 * expected to behave (no backing database).
 */
interface MockSession {
	userId: number | null
	activeLocationId: number | null
}

const session: MockSession = {
	userId: null,
	activeLocationId: null,
}

export function login(username: string, password: string) {
	const user = mockUsers.find((u) => u.username === username && u.password === password)
	if (!user) return undefined
	session.userId = user.id
	session.activeLocationId = mockLocationSeed[0]?.id ?? null
	return user
}

export function logout(): void {
	session.userId = null
	session.activeLocationId = null
}

export function currentUser() {
	if (session.userId === null) return undefined
	return mockUsers.find((u) => u.id === session.userId)
}

export function currentLocation() {
	if (session.activeLocationId === null) return null
	return mockLocationSeed.find((l) => l.id === session.activeLocationId) ?? null
}

export function switchLocation(locationId: number | null) {
	session.activeLocationId = locationId
	return currentLocation()
}

export function accessibleLocations() {
	// Prototype: every mock user sees every seeded location.
	return mockLocationSeed
}
