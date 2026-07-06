import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const HRError = {
	attendanceNotFound: (id: number) =>
		new NotFoundError(`Attendance with ID ${id} not found`, {
			code: 'ATTENDANCE_NOT_FOUND',
			context: { id },
		}),
	alreadyClockedIn: (employeeId: number) =>
		new ConflictError(`Employee with ID ${employeeId} is already clocked in`, {
			code: 'ALREADY_CLOCKED_IN',
			context: { employeeId },
		}),
	notClockedIn: (id: number) =>
		new ConflictError(`Attendance with ID ${id} is not clocked in`, {
			code: 'NOT_CLOCKED_IN',
			context: { id },
		}),
	alreadyClockedOut: (id: number) =>
		new ConflictError(`Attendance with ID ${id} is already clocked out`, {
			code: 'ALREADY_CLOCKED_OUT',
			context: { id },
		}),
	createShiftFailed: () =>
		new InternalServerError('Shift creation failed', { code: 'SHIFT_CREATE_FAILED' }),
	clockInFailed: () => new InternalServerError('Clock in failed', { code: 'CLOCK_IN_FAILED' }),
	clockOutFailed: () => new InternalServerError('Clock out failed', { code: 'CLOCK_OUT_FAILED' }),
}
