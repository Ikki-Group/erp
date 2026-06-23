import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

/**
 * UOM Module Error Helpers
 */
export const UomError = {
	/**
	 * UOM not found by ID
	 */
	notFound: (id: number) =>
		new NotFoundError('UOM not found', {
			code: 'UOM_NOT_FOUND',
			context: { id },
		}),

	/**
	 * UOM creation failed (database or system error)
	 */
	createFailed: () =>
		new InternalServerError('UOM creation failed', {
			code: 'UOM_CREATE_FAILED',
		}),
}
