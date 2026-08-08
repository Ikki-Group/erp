import { suppliers, supplierMaterials } from '@/db/schema/supplier.ts'

import {
	allOf,
	and,
	buildPaginationMeta,
	eq,
	eqIf,
	inArray,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
} from '@/infra/database/index.ts'
import type { DbContext, SQL } from '@/infra/database/index.ts'
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
type SupplierUpdate = Partial<Omit<SupplierInsert, 'id'>>

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
		isActive: row.isActive === 1,
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

export interface ISupplierRepo {
	readonly db: DbContext

	// ─── Supplier ───
	findById(id: number, db?: DbContext): Promise<SupplierDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<SupplierDto[]>
	findPage(filter: SupplierFilterDto, db?: DbContext): Promise<WithPaginationResult<SupplierDto>>
	insert(data: SupplierInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: SupplierUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, data: SupplierUpdate, db?: DbContext): Promise<EntityRef | undefined>

	// ─── Supplier-Material Pricing ───
	findPricingById(id: number, db?: DbContext): Promise<SupplierMaterialDto | undefined>
	findPricingPage(filter: SupplierMaterialFilterDto, db?: DbContext): Promise<WithPaginationResult<SupplierMaterialDto>>
	findPricingByPair(supplierId: number, materialId: number, db?: DbContext): Promise<SupplierMaterialDto | undefined>
	insertPricing(data: SupplierMaterialInsert, db?: DbContext): Promise<EntityRef | undefined>
	updatePricing(id: number, data: SupplierMaterialUpdate, db?: DbContext): Promise<EntityRef | undefined>
	removePricing(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class SupplierRepo implements ISupplierRepo {
	constructor(readonly db: DbContext) {}

	// ─── Supplier ───

	async findById(id: number, db: DbContext = this.db): Promise<SupplierDto | undefined> {
		const row = await db
			.select()
			.from(suppliers)
			.where(eq(suppliers.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<SupplierDto[]> {
		if (ids.length === 0) return []
		const rows = await db.select().from(suppliers).where(inArray(suppliers.id, ids))
		return rows.map(toDto)
	}

	async findPage(
		filter: SupplierFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<SupplierDto>> {
		const { limit, offset } = toLimitOffset(filter)

		const conditions: (SQL | undefined)[] = [
			searchAcross(filter.q, [suppliers.code, suppliers.name]),
			eqIf(suppliers.isActive, filter.isActive),
		]

		const where = allOf(...conditions)
		const rows = await db
			.select({
				id: suppliers.id,
				code: suppliers.code,
				name: suppliers.name,
				contactPerson: suppliers.contactPerson,
				phone: suppliers.phone,
				email: suppliers.email,
				address: suppliers.address,
				paymentTerms: suppliers.paymentTerms,
				isActive: suppliers.isActive,
				createdAt: suppliers.createdAt,
				updatedAt: suppliers.updatedAt,
				createdBy: suppliers.createdBy,
				updatedBy: suppliers.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(suppliers)
			.where(where)
			.orderBy(sql`${suppliers.id} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insert(data: SupplierInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(suppliers).values(data).returning({ id: suppliers.id })
		return result
	}

	async update(id: number, data: SupplierUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(suppliers)
			.set(data)
			.where(eq(suppliers.id, id))
			.returning({ id: suppliers.id })
		return result
	}

	async remove(id: number, data: SupplierUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(suppliers)
			.set({ ...data, isActive: 0 })
			.where(eq(suppliers.id, id))
			.returning({ id: suppliers.id })
		return result
	}

	// ─── Supplier-Material Pricing ───

	async findPricingById(id: number, db: DbContext = this.db): Promise<SupplierMaterialDto | undefined> {
		const row = await db
			.select()
			.from(supplierMaterials)
			.where(eq(supplierMaterials.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toPricingDto(row) : undefined
	}

	async findPricingPage(
		filter: SupplierMaterialFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<SupplierMaterialDto>> {
		const { limit, offset } = toLimitOffset(filter)

		const conditions: (SQL | undefined)[] = [
			eqIf(supplierMaterials.supplierId, filter.supplierId),
			eqIf(supplierMaterials.materialId, filter.materialId),
		]

		const where = allOf(...conditions)
		const rows = await db
			.select({
				id: supplierMaterials.id,
				supplierId: supplierMaterials.supplierId,
				materialId: supplierMaterials.materialId,
				unitPrice: supplierMaterials.unitPrice,
				uomId: supplierMaterials.uomId,
				minOrderQty: supplierMaterials.minOrderQty,
				createdAt: supplierMaterials.createdAt,
				updatedAt: supplierMaterials.updatedAt,
				createdBy: supplierMaterials.createdBy,
				updatedBy: supplierMaterials.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(supplierMaterials)
			.where(where)
			.orderBy(sql`${supplierMaterials.id} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toPricingDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async findPricingByPair(
		supplierId: number,
		materialId: number,
		db: DbContext = this.db,
	): Promise<SupplierMaterialDto | undefined> {
		const row = await db
			.select()
			.from(supplierMaterials)
			.where(and(
				eq(supplierMaterials.supplierId, supplierId),
				eq(supplierMaterials.materialId, materialId),
			))
			.limit(1)
			.then(takeFirst)
		return row ? toPricingDto(row) : undefined
	}

	async insertPricing(data: SupplierMaterialInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(supplierMaterials)
			.values(data)
			.returning({ id: supplierMaterials.id })
		return result
	}

	async updatePricing(
		id: number,
		data: SupplierMaterialUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(supplierMaterials)
			.set(data)
			.where(eq(supplierMaterials.id, id))
			.returning({ id: supplierMaterials.id })
		return result
	}

	async removePricing(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(supplierMaterials)
			.where(eq(supplierMaterials.id, id))
			.returning({ id: supplierMaterials.id })
		return result
	}
}
