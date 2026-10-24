import { mockUsers } from './fixtures/auth.ts'
import { mockLocationSeed } from './fixtures/location.ts'

/**
 * Mock "session" — module-level state standing in for the server's cookie
 * session. Resets on full page reload, matching how a prototype build is
 * expected to behave (no backing database).
 */
interface MockSession {
	userId: number | null
}

const session: MockSession = {
	userId: null,
}

export function login(username: string, password: string) {
	const user = mockUsers.find((u) => u.username === username && u.password === password)
	if (!user) return undefined
	session.userId = user.id

	return user
}

export function logout(): void {
	session.userId = null
}

export function currentUser() {
	if (session.userId === null) return undefined
	return mockUsers.find((u) => u.id === session.userId)
}

export function accessibleLocations() {
	// Prototype: every mock user sees every seeded location.
	return mockLocationSeed
}
