import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const SalesOrderError = {
	notFound: (id: number) =>
		new NotFoundError('Sales order not found', { code: 'SALES_ORDER_NOT_FOUND', context: { id } }),
	itemNotFound: (id: number) =>
		new NotFoundError('Sales order item not found', { code: 'SALES_ORDER_ITEM_NOT_FOUND', context: { id } }),
	notOpen: (id: number) =>
		new BadRequestError('Sales order is not open', { code: 'SALES_ORDER_NOT_OPEN', context: { id } }),
	createFailed: () =>
		new InternalServerError('Sales order creation failed', { code: 'SALES_ORDER_CREATE_FAILED' }),
	batchCreateFailed: () =>
		new InternalServerError('Sales order batch creation failed', { code: 'SALES_ORDER_BATCH_CREATE_FAILED' }),
}
