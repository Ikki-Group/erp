import {
	BadRequestError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
} from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const ShiftError = {
	notFound: (id: number) =>
		new NotFoundError('Shift not found', {
			code: 'SHIFT_NOT_FOUND',
			context: { id },
		}),
	alreadyOpen: (userId: number, locationId: number) =>
		new BadRequestError('A shift is already open for this user at this location', {
			code: 'SHIFT_ALREADY_OPEN',
			context: { userId, locationId },
		}),
	notOpen: (id: number) =>
		new BadRequestError('Shift is not open', {
			code: 'SHIFT_NOT_OPEN',
			context: { id },
		}),
	notStoreLocation: (locationId: number) =>
		new BadRequestError('Shifts can only be opened at store-type locations', {
			code: 'SHIFT_NOT_STORE_LOCATION',
			context: { locationId },
		}),
	closeOtherDenied: () =>
		new ForbiddenError('Insufficient permissions', {
			code: 'PERMISSION_DENIED',
			context: { required: 'shift.close-other' },
		}),
	openFailed: () =>
		new InternalServerError('Shift open failed', {
			code: 'SHIFT_OPEN_FAILED',
		}),
}
