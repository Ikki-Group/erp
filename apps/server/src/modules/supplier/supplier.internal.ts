import { suppliers } from '@/db/schema/supplier.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { defineEntityErrors } from '@/shared/errors/entity-errors.ts'
import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

import type { SupplierCreateDto } from './supplier.contract.ts'

// ─── Error Factories ───

export const SupplierError = {
	...defineEntityErrors('Supplier', 'SUPPLIER'),
	pricingNotFound: (id: number) =>
		new NotFoundError('Supplier pricing not found', {
			code: 'SUPPLIER_PRICING_NOT_FOUND',
			context: { id },
		}),
	pricingCreateFailed: () =>
		new InternalServerError('Supplier pricing creation failed', {
			code: 'SUPPLIER_PRICING_CREATE_FAILED',
		}),
	pricingUpdateFailed: (id: number) =>
		new InternalServerError('Supplier pricing update failed', {
			code: 'SUPPLIER_PRICING_UPDATE_FAILED',
			context: { id },
		}),
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
