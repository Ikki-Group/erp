import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const ProductionError = {
	recipeNotFound: (id: number) =>
		new NotFoundError('Production recipe not found', {
			code: 'PRODUCTION_RECIPE_NOT_FOUND',
			context: { id },
		}),
	orderNotFound: (id: number) =>
		new NotFoundError('Production order not found', {
			code: 'PRODUCTION_ORDER_NOT_FOUND',
			context: { id },
		}),
	notSemiFinished: (materialId: number) =>
		new BadRequestError('Output material must be of type semi_finished', {
			code: 'PRODUCTION_NOT_SEMI_FINISHED',
			context: { materialId },
		}),
	insufficientStock: (
		materialId: number,
		locationId: number,
		available: string,
		required: string,
	) =>
		new BadRequestError('Insufficient stock for production input', {
			code: 'PRODUCTION_INSUFFICIENT_STOCK',
			context: { materialId, locationId, available, required },
		}),
	notDraft: (id: number) =>
		new BadRequestError('Production order must be in "draft" status to perform this action', {
			code: 'PRODUCTION_NOT_DRAFT',
			context: { id },
		}),
	alreadyConfirmed: (id: number) =>
		new BadRequestError('Production order has already been completed', {
			code: 'PRODUCTION_ALREADY_CONFIRMED',
			context: { id },
		}),
	uomNotConvertible: (materialId: number, fromUomId: number, toUomId: number) =>
		new BadRequestError('UoM cannot be converted to material base UoM', {
			code: 'PRODUCTION_UOM_NOT_CONVERTIBLE',
			context: { materialId, fromUomId, toUomId },
		}),
	createFailed: () =>
		new InternalServerError('Production record creation failed', {
			code: 'PRODUCTION_CREATE_FAILED',
		}),
}
