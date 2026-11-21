import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const StockError = {
	insufficientStock: (
		materialId: number,
		locationId: number,
		available: string,
		requested: string,
	) =>
		new BadRequestError('Insufficient stock for this operation', {
			code: 'STOCK_INSUFFICIENT',
			context: { materialId, locationId, available, requested },
		}),
	materialNotAssigned: (materialId: number, locationId: number) =>
		new BadRequestError('Material is not assigned to this location', {
			code: 'STOCK_MATERIAL_NOT_ASSIGNED',
			context: { materialId, locationId },
		}),
	balanceNotFound: (materialId: number, locationId: number) =>
		new NotFoundError('Stock balance not found', {
			code: 'STOCK_BALANCE_NOT_FOUND',
			context: { materialId, locationId },
		}),
	movementFailed: () =>
		new InternalServerError('Stock movement recording failed', {
			code: 'STOCK_MOVEMENT_FAILED',
		}),
}
