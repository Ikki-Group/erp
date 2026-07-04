import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const ProductionError = {
	notFound: (id: number) =>
		new NotFoundError('Work order not found', { code: 'WORK_ORDER_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Work order creation failed', { code: 'WORK_ORDER_CREATE_FAILED' }),
	updateFailed: () =>
		new InternalServerError('Work order update failed', { code: 'WORK_ORDER_UPDATE_FAILED' }),
	invalidStatus: (id: number, status: string) =>
		new ConflictError(`Work order ${id} cannot be started from status: ${status}`, {
			code: 'WORK_ORDER_INVALID_STATUS',
		}),
	notInProgress: (id: number) =>
		new ConflictError(`Work order ${id} is not in progress`, {
			code: 'WORK_ORDER_NOT_IN_PROGRESS',
		}),
}
