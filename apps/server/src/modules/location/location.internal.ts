import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const LocationError = {
	notFound: (id: number) =>
		new NotFoundError('Location not found', { code: 'LOCATION_NOT_FOUND', context: { id } }),
	nameExists: () =>
		new ConflictError('Location name already exists', { code: 'LOCATION_NAME_EXISTS' }),
	codeExists: () =>
		new ConflictError('Location code already exists', { code: 'LOCATION_CODE_EXISTS' }),
	createFailed: () =>
		new InternalServerError('Location creation failed', { code: 'LOCATION_CREATE_FAILED' }),
	updateFailed: (id: number) =>
		new InternalServerError('Location update failed', {
			code: 'LOCATION_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Location deletion failed', {
			code: 'LOCATION_DELETE_FAILED',
			context: { id },
		}),
}
