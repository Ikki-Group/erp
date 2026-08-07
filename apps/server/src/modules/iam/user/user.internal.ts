import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const UserError = {
	notFound: (id: number) =>
		new NotFoundError('User not found', {
			code: 'USER_NOT_FOUND',
			context: { id },
		}),

	createFailed: () =>
		new InternalServerError('User creation failed', {
			code: 'USER_CREATE_FAILED',
		}),

	passwordMismatch: () =>
		new BadRequestError('Old password does not match', {
			code: 'USER_PASSWORD_MISMATCH',
		}),
}
