import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const TableError = {
	notFound: (id: number) =>
		new NotFoundError('Table not found', {
			code: 'TABLE_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Table creation failed', {
			code: 'TABLE_CREATE_FAILED',
		}),
	updateFailed: (id: number) =>
		new InternalServerError('Table update failed', {
			code: 'TABLE_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Table deletion failed', {
			code: 'TABLE_DELETE_FAILED',
			context: { id },
		}),
	numberExists: (locationId: number, number: string) =>
		new ConflictError('Table number already exists at this location', {
			code: 'TABLE_NUMBER_EXISTS',
			context: { locationId, number },
		}),
	notStoreLocation: (locationId: number) =>
		new BadRequestError('Tables can only be created at store-type locations', {
			code: 'TABLE_NOT_STORE_LOCATION',
			context: { locationId },
		}),
}
