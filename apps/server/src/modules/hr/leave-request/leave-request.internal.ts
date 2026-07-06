import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const LeaveRequestError = {
	notFound: (id: number) =>
		new NotFoundError(`Leave request with ID ${id} not found`, { code: 'LEAVE_REQUEST_NOT_FOUND' }),
	invalidStatus: (currentStatus: string) =>
		new InternalServerError(
			`Cannot approve/reject/cancel leave request with status ${currentStatus}`,
			{ code: 'INVALID_LEAVE_STATUS' },
		),
	createFailed: () =>
		new InternalServerError('Leave request creation failed', { code: 'LEAVE_REQUEST_CREATE_FAILED' }),
	updateFailed: (id: number) =>
		new NotFoundError('Leave request not found', { code: 'LEAVE_REQUEST_NOT_FOUND', context: { id } }),
	deleteFailed: (id: number) =>
		new NotFoundError('Leave request not found', { code: 'LEAVE_REQUEST_NOT_FOUND', context: { id } }),
}
