import { getTableColumns } from 'drizzle-orm'

import { materials, materialLocations } from '@/db/schema/material.ts'

import { createCrudRepo } from '@/infra/database/crud.repo.ts'
import type { SoftDeleteCrudRepo } from '@/infra/database/crud.repo.ts'
import {
	allOf,
	eq,
	eqIf,
	paginateWindow,
	searchAcross,
	sql,
	toLimitOffset,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'

import type { MaterialDto, MaterialFilterDto } from './material.contract.ts'

// ─── Types ───

type MaterialInsert = typeof materials.$inferInsert
type MaterialRow = typeof materials.$inferSelect

function toDto(row: MaterialRow): MaterialDto {
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

export interface IMaterialRepo extends SoftDeleteCrudRepo<MaterialDto, MaterialInsert> {
	findPage(filter: MaterialFilterDto, db?: DbContext): Promise<WithPaginationResult<MaterialDto>>
}

// ─── Implementation ───

export function createMaterialRepo(baseDb: DbContext): IMaterialRepo {
	const crud = createCrudRepo({ db: baseDb, table: materials, toDto, softDelete: true })

	return {
		...crud,

		// Location-scoped lists INNER JOIN material_locations; otherwise the global view.
		async findPage(filter, db = baseDb) {
			const { limit, offset } = toLimitOffset(filter)
			const query = db
				.select({
					...getTableColumns(materials),
					rowCount: sql<number>`count(*) over()`.as('row_count'),
				})
				.from(materials)
				.$dynamic()
			if (filter.locationId) {
				query.innerJoin(materialLocations, eq(materialLocations.materialId, materials.id))
			}
			const rows = await query
				.where(
					allOf(
						searchAcross(filter.q, [materials.code, materials.name]),
						eqIf(materials.categoryId, filter.categoryId),
						eqIf(materials.type, filter.type),
						filter.locationId ? eq(materialLocations.locationId, filter.locationId) : undefined,
					),
				)
				.orderBy(sql`${materials.id} desc`)
				.limit(limit)
				.offset(offset)
			const page = paginateWindow(rows, filter)
			return { data: page.data.map(toDto), meta: page.meta }
		},
	}
}
