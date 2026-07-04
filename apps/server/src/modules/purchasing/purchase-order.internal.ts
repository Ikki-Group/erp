import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const PurchaseOrderError = {
	notFound: (id: number) =>
		new NotFoundError('Purchase order not found', { code: 'PURCHASE_ORDER_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Purchase order creation failed', { code: 'PURCHASE_ORDER_CREATE_FAILED' }),
	updateFailed: () =>
		new InternalServerError('Purchase order update failed', { code: 'PURCHASE_ORDER_UPDATE_FAILED' }),
	invalidStatus: (status: string) =>
		new InternalServerError(`Cannot transition from status '${status}'`, { code: 'PURCHASE_ORDER_INVALID_STATUS' }),
}
