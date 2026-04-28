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
