import { materials, materialLocations } from '@/db/schema/material.ts'

import {
	allOf,
	eq,
	eqIf,
	inArray,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext, SQL } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { MaterialDto, MaterialFilterDto } from './material.contract.ts'

// ─── Types ───

type MaterialInsert = typeof materials.$inferInsert
type MaterialUpdate = Partial<Omit<MaterialInsert, 'id'>>

interface MaterialRowLike {
	id: number
	code: string
	name: string
	type: 'raw' | 'semi_finished'
	categoryId: number | null
	baseUomId: number
	defaultPurchaseUomId: number | null
	defaultStockUomId: number | null
	defaultRecipeUomId: number | null
	minStock: string | null
	isActive: boolean
	createdAt: Date
	updatedAt: Date
	createdBy: number | null
	updatedBy: number | null
}

function toDto(row: MaterialRowLike): MaterialDto {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		type: row.type,
		categoryId: row.categoryId,
		baseUomId: row.baseUomId,
		defaultPurchaseUomId: row.defaultPurchaseUomId,
		defaultStockUomId: row.defaultStockUomId,
		defaultRecipeUomId: row.defaultRecipeUomId,
		minStock: row.minStock,
		isActive: row.isActive,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface IMaterialRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<MaterialDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<MaterialDto[]>
	findPage(filter: MaterialFilterDto, db?: DbContext): Promise<WithPaginationResult<MaterialDto>>
	insert(data: MaterialInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: MaterialUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, data: MaterialUpdate, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class MaterialRepo implements IMaterialRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<MaterialDto | undefined> {
		const row = await db
			.select()
			.from(materials)
			.where(eq(materials.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<MaterialDto[]> {
		if (ids.length === 0) return []
		const rows = await db.select().from(materials).where(inArray(materials.id, ids))
		return rows.map(toDto)
	}

	async findPage(
		filter: MaterialFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<MaterialDto>> {
		const { limit, offset } = toLimitOffset(filter)

		// Build WHERE conditions
		const conditions: (SQL | undefined)[] = [
			searchAcross(filter.q, [materials.code, materials.name]),
			eqIf(materials.categoryId, filter.categoryId),
			eqIf(materials.type, filter.type),
		]

		// Location-scoped: INNER JOIN material_locations
		if (filter.locationId) {
			conditions.push(eq(materialLocations.locationId, filter.locationId))

			const where = allOf(...conditions)
			const rows = await db
				.select({
					id: materials.id,
					code: materials.code,
					name: materials.name,
					type: materials.type,
					categoryId: materials.categoryId,
					baseUomId: materials.baseUomId,
					defaultPurchaseUomId: materials.defaultPurchaseUomId,
					defaultStockUomId: materials.defaultStockUomId,
					defaultRecipeUomId: materials.defaultRecipeUomId,
					minStock: materials.minStock,
					isActive: materials.isActive,
					createdAt: materials.createdAt,
					updatedAt: materials.updatedAt,
					createdBy: materials.createdBy,
					updatedBy: materials.updatedBy,
					rowCount: sql<number>`count(*) over()`.as('row_count'),
				})
				.from(materials)
				.innerJoin(materialLocations, eq(materialLocations.materialId, materials.id))
				.where(where)
				.orderBy(sql`${materials.id} desc`)
				.limit(limit)
				.offset(offset)

			const total = rows[0]?.rowCount ?? 0
			return {
				data: rows.map((row) => toDto(row)),
				meta: buildPaginationMeta(filter.page, filter.limit, total),
			}
		}

		// Global view (no location filter)
		const where = allOf(...conditions)
		const rows = await db
			.select({
				id: materials.id,
				code: materials.code,
				name: materials.name,
				type: materials.type,
				categoryId: materials.categoryId,
				baseUomId: materials.baseUomId,
				defaultPurchaseUomId: materials.defaultPurchaseUomId,
				defaultStockUomId: materials.defaultStockUomId,
				defaultRecipeUomId: materials.defaultRecipeUomId,
				minStock: materials.minStock,
				isActive: materials.isActive,
				createdAt: materials.createdAt,
				updatedAt: materials.updatedAt,
				createdBy: materials.createdBy,
				updatedBy: materials.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(materials)
			.where(where)
			.orderBy(sql`${materials.id} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insert(data: MaterialInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(materials).values(data).returning({ id: materials.id })
		return result
	}

	async update(
		id: number,
		data: MaterialUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(materials)
			.set(data)
			.where(eq(materials.id, id))
			.returning({ id: materials.id })
		return result
	}

	async remove(
		id: number,
		data: MaterialUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(materials)
			.set({ ...data, isActive: false })
			.where(eq(materials.id, id))
			.returning({ id: materials.id })
		return result
	}
}
