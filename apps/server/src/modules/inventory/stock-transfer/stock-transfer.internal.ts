import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const StockTransferError = {
	notFound: (id: number) =>
		new NotFoundError('Stock transfer not found', { code: 'STOCK_TRANSFER_NOT_FOUND', context: { id } }),
	invalidStatus: (currentStatus: string, action: string) =>
		new InternalServerError(`Cannot ${action} transfer with status ${currentStatus}`, {
			code: 'INVALID_TRANSFER_STATUS',
		}),
	createFailed: () =>
		new InternalServerError('Stock transfer creation failed', { code: 'STOCK_TRANSFER_CREATE_FAILED' }),
}
