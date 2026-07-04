import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const GoodsReceiptError = {
	notFound: (id: number) =>
		new NotFoundError('Goods receipt not found', { code: 'GOODS_RECEIPT_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Goods receipt creation failed', { code: 'GOODS_RECEIPT_CREATE_FAILED' }),
	updateFailed: () =>
		new InternalServerError('Goods receipt update failed', { code: 'GOODS_RECEIPT_UPDATE_FAILED' }),
	alreadyCompleted: (status: string) =>
		new ConflictError(`Goods receipt is already ${status}`, { code: 'GOODS_RECEIPT_STATUS_CONFLICT' }),
}
