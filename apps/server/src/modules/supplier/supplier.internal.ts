import { suppliers } from '@/db/schema/supplier.ts'
import { defineConflictFields } from '@/infra/database/index.ts'
import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

import type { SupplierCreateDto } from './supplier.contract.ts'

// ─── Error Factories ───

export const SupplierError = {
	notFound: (id: number) =>
		new NotFoundError('Supplier not found', { code: 'SUPPLIER_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Supplier creation failed', { code: 'SUPPLIER_CREATE_FAILED' }),
	updateFailed: (id: number) =>
		new InternalServerError('Supplier update failed', { code: 'SUPPLIER_UPDATE_FAILED', context: { id } }),
	deleteFailed: (id: number) =>
		new InternalServerError('Supplier deletion failed', { code: 'SUPPLIER_DELETE_FAILED', context: { id } }),
	pricingNotFound: (id: number) =>
		new NotFoundError('Supplier pricing not found', { code: 'SUPPLIER_PRICING_NOT_FOUND', context: { id } }),
	pricingCreateFailed: () =>
		new InternalServerError('Supplier pricing creation failed', { code: 'SUPPLIER_PRICING_CREATE_FAILED' }),
	pricingUpdateFailed: (id: number) =>
		new InternalServerError('Supplier pricing update failed', { code: 'SUPPLIER_PRICING_UPDATE_FAILED', context: { id } }),
	pricingExists: (supplierId: number, materialId: number) =>
		new ConflictError('Pricing already exists for this supplier-material pair', {
			code: 'SUPPLIER_PRICING_EXISTS',
			context: { supplierId, materialId },
		}),
}

// ─── Unique Constraint Fields ───

export const uniqueFields = defineConflictFields<SupplierCreateDto>()([
	{
		field: 'code',
		column: suppliers.code,
		message: 'Supplier code already exists',
		code: 'SUPPLIER_CODE_EXISTS',
	},
])
