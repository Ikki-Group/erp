import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const RoleError = {
	notFound: (id: number) =>
		new NotFoundError('Role not found', {
			code: 'ROLE_NOT_FOUND',
			context: { id },
		}),

	createFailed: () =>
		new InternalServerError('Role creation failed', {
			code: 'ROLE_CREATE_FAILED',
		}),

	updateSystemRole: () =>
		new BadRequestError('Cannot update system role', {
			code: 'ROLE_UPDATE_SYSTEM_ROLE_FORBIDDEN',
		}),

	deleteSystemRole: () =>
		new BadRequestError('Cannot delete system role', {
			code: 'ROLE_DELETE_SYSTEM_ROLE_FORBIDDEN',
		}),
}
