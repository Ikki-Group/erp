import { suppliers, supplierMaterials } from '@/db/schema/supplier.ts'

import { createCrudRepo } from '@/infra/database/crud.repo.ts'
import type { SoftDeleteCrudRepo } from '@/infra/database/crud.repo.ts'
import { allOf, and, eq, eqIf, searchAcross, takeFirst } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type {
	SupplierDto,
	SupplierFilterDto,
	SupplierMaterialDto,
	SupplierMaterialFilterDto,
} from './supplier.contract.ts'

// ─── Types ───

type SupplierInsert = typeof suppliers.$inferInsert

type SupplierMaterialInsert = typeof supplierMaterials.$inferInsert
type SupplierMaterialUpdate = Partial<Omit<SupplierMaterialInsert, 'id'>>

type SupplierRow = typeof suppliers.$inferSelect
type SupplierMaterialRow = typeof supplierMaterials.$inferSelect

// ─── Mappers ───

function toDto(row: SupplierRow): SupplierDto {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		contactPerson: row.contactPerson,
		phone: row.phone,
		email: row.email,
		address: row.address,
		paymentTerms: row.paymentTerms,
		isActive: row.isActive,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

function toPricingDto(row: SupplierMaterialRow): SupplierMaterialDto {
	return {
		id: row.id,
		supplierId: row.supplierId,
		materialId: row.materialId,
		unitPrice: row.unitPrice,
		uomId: row.uomId,
		minOrderQty: row.minOrderQty,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface ISupplierRepo extends SoftDeleteCrudRepo<SupplierDto, SupplierInsert> {
	findPage(filter: SupplierFilterDto, db?: DbContext): Promise<WithPaginationResult<SupplierDto>>

	// ─── Supplier-Material Pricing ───
	findPricingById(id: number, db?: DbContext): Promise<SupplierMaterialDto | undefined>
	findPricingPage(
		filter: SupplierMaterialFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<SupplierMaterialDto>>
	findPricingByPair(
		supplierId: number,
		materialId: number,
		db?: DbContext,
	): Promise<SupplierMaterialDto | undefined>
	insertPricing(data: SupplierMaterialInsert, db?: DbContext): Promise<EntityRef | undefined>
	updatePricing(
		id: number,
		data: SupplierMaterialUpdate,
		db?: DbContext,
	): Promise<EntityRef | undefined>
	removePricing(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export function createSupplierRepo(baseDb: DbContext): ISupplierRepo {
	const crud = createCrudRepo({ db: baseDb, table: suppliers, toDto, softDelete: true })
	const pricing = createCrudRepo({ db: baseDb, table: supplierMaterials, toDto: toPricingDto })

	return {
		...crud,

		findPage: (filter, db) =>
			crud.paginate(
				filter,
				{
					where: allOf(
						searchAcross(filter.q, [suppliers.code, suppliers.name]),
						eqIf(suppliers.isActive, filter.isActive),
					),
				},
				db,
			),

		// ─── Supplier-Material Pricing ───

		findPricingById: pricing.findById,
		insertPricing: pricing.insert,
		updatePricing: pricing.update,
		removePricing: pricing.remove,

		findPricingPage: (filter, db) =>
			pricing.paginate(
				filter,
				{
					where: allOf(
						eqIf(supplierMaterials.supplierId, filter.supplierId),
						eqIf(supplierMaterials.materialId, filter.materialId),
					),
				},
				db,
			),

		async findPricingByPair(supplierId, materialId, db = baseDb) {
			const row = await db
				.select()
				.from(supplierMaterials)
				.where(
					and(
						eq(supplierMaterials.supplierId, supplierId),
						eq(supplierMaterials.materialId, materialId),
					),
				)
				.limit(1)
				.then(takeFirst)
			return row ? toPricingDto(row) : undefined
		},
	}
}
