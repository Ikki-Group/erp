import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const ReceivingError = {
	notFound: (id: number) =>
		new NotFoundError('Receiving not found', {
			code: 'RECEIVING_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Receiving creation failed', {
			code: 'RECEIVING_CREATE_FAILED',
		}),
	notDraft: (id: number) =>
		new BadRequestError('Receiving must be in "draft" status to perform this action', {
			code: 'RECEIVING_NOT_DRAFT',
			context: { id },
		}),
	alreadyConfirmed: (id: number) =>
		new BadRequestError('Receiving has already been confirmed', {
			code: 'RECEIVING_ALREADY_CONFIRMED',
			context: { id },
		}),
	materialNotAssigned: (materialId: number, locationId: number) =>
		new BadRequestError('Material is not assigned to this location', {
			code: 'RECEIVING_MATERIAL_NOT_ASSIGNED',
			context: { materialId, locationId },
		}),
	supplierNotFound: (supplierId: number) =>
		new NotFoundError('Supplier not found', {
			code: 'RECEIVING_SUPPLIER_NOT_FOUND',
			context: { supplierId },
		}),
	uomNotConvertible: (materialId: number, fromUomId: number, toUomId: number) =>
		new BadRequestError('UoM cannot be converted to material base UoM', {
			code: 'RECEIVING_UOM_NOT_CONVERTIBLE',
			context: { materialId, fromUomId, toUomId },
		}),
}
