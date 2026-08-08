import { ForbiddenError, UnauthorizedError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const AuthError = {
	invalidCredentials: () =>
		new UnauthorizedError('Invalid credentials', { code: 'INVALID_CREDENTIALS' }),
	userDeactivated: () =>
		new UnauthorizedError('User account is deactivated', { code: 'USER_DEACTIVATED' }),
	sessionExpired: () =>
		new UnauthorizedError('Session expired or invalid', { code: 'SESSION_EXPIRED' }),
	locationNotAuthorized: (locationId: number) =>
		new ForbiddenError('Not authorized for this location', {
			code: 'LOCATION_NOT_AUTHORIZED',
			context: { locationId },
		}),
}
