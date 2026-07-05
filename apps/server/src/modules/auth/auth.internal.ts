import { UnauthorizedError } from '@/shared/errors/http-error'

/**
 * Auth Module Error Helpers
 *
 * Centralized error definitions for authentication operations.
 * All errors return UnauthorizedError to prevent user enumeration.
 */
export const AuthError = {
	/**
	 * User not found or inactive
	 * Used during login to prevent user enumeration
	 */
	userNotFound: () =>
		new UnauthorizedError('User not found', {
			code: 'AUTH_USER_NOT_FOUND',
		}),

	/**
	 * Invalid credentials (password mismatch)
	 * Generic message to prevent brute force hints
	 */
	invalidCredentials: () =>
		new UnauthorizedError('Invalid credentials', {
			code: 'AUTH_INVALID_CREDENTIALS',
		}),

	/**
	 * Invalid or expired session token
	 * Used during token verification
	 */
	invalidToken: () =>
		new UnauthorizedError('Invalid or expired token', {
			code: 'AUTH_INVALID_TOKEN',
		}),
}
