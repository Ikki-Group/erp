import { Elysia } from 'elysia'

import { AuthContext, type AuthenticatedUser } from '@/core/http/auth-macro'

export const mockAuthenticatedUser: AuthenticatedUser = {
	id: 1,
	email: 'test@example.com',
	username: 'testuser',
	fullname: 'Test User',
	isActive: true,
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-01'),
	createdBy: 1,
	updatedBy: 1,
}

export function createMockAuthPlugin(user: AuthenticatedUser | null = mockAuthenticatedUser) {
	return new Elysia({ name: 'mock-auth' })
		.decorate('auth', new AuthContext(user))
		.derive(({ auth }) => ({ auth }))
		.macro({
			auth: (enabled: boolean) => ({
				resolve: ({ auth }) => {
					if (enabled && !auth.isAuthenticated) {
						throw new Error('Unauthorized')
					}
				},
			}),
		})
		.as('global')
}

export function createUnauthenticatedPlugin() {
	return createMockAuthPlugin(null)
}

export function authHeaders(token: string = 'test-token') {
	return { Authorization: `Bearer ${token}` }
}

/**
 * Mock auth service for testing without database sessions.
 * Verifies test tokens and returns mock user data.
 */
export class MockAuthService {
	async verifyToken(token: string): Promise<AuthenticatedUser | null> {
		// For testing, accept any token that looks like a JWT
		if (token && token.length > 10) {
			return mockAuthenticatedUser
		}
		return null
	}

	async getById(id: number): Promise<AuthenticatedUser | null> {
		// Return mock user for any ID
		if (id === 1) {
			return mockAuthenticatedUser
		}
		return null
	}
}

/**
 * Mock login service for testing without database sessions.
 */
export class MockLoginService {
	async login(): Promise<{ user: AuthenticatedUser; token: string }> {
		return {
			user: mockAuthenticatedUser,
			token: 'mock-test-token',
		}
	}

	async getById(id: number): Promise<AuthenticatedUser | null> {
		// Return mock user for any ID
		if (id === 1) {
			return mockAuthenticatedUser
		}
		return null
	}
}
