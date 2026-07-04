import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const StockTransactionError = {
	notFound: (id: number) =>
		new NotFoundError('Stock transaction not found', {
			code: 'STOCK_TRANSACTION_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Stock transaction creation failed', {
			code: 'STOCK_TRANSACTION_CREATE_FAILED',
		}),
	insufficientStock: (materialId: number, available: string, requested: string) =>
		new BadRequestError(`Insufficient stock for material ${materialId}: available ${available}, requested ${requested}`, {
			code: 'INSUFFICIENT_STOCK',
			context: { materialId, available, requested },
		}),
	negativeStock: (materialId: number) =>
		new BadRequestError(`Adjustment results in negative stock for material ${materialId}`, {
			code: 'NEGATIVE_STOCK_RESULT',
			context: { materialId },
		}),
}
