import { stockBalances, stockMovements } from '@/db/schema/inventory.ts'
import { materials } from '@/db/schema/material.ts'
import { uoms } from '@/db/schema/uom.ts'

import {
	allOf,
	eq,
	eqIf,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
	and,
	inArray,
	searchAcross,
} from '@/infra/database/index.ts'
import type { Db, DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type {
	StockBalanceDto,
	StockBalanceFilterDto,
	StockMovementDto,
	StockMovementFilterDto,
} from '@ikki/contract/inventory/stock'

// ─── Types ───

type BalanceRow = typeof stockBalances.$inferSelect
type MovementRow = typeof stockMovements.$inferSelect
type MovementInsert = typeof stockMovements.$inferInsert

function toBalanceDto(row: BalanceRow): StockBalanceDto {
	return {
		id: row.id,
		materialId: row.materialId,
		materialCode: '',
		materialName: '',
		locationId: row.locationId,
		quantity: row.quantity,
		costPrice: row.costPrice,
		uomCode: '',
		minStock: null,
	}
}

interface EnrichedBalanceRow {
	id: number
	materialId: number
	locationId: number
	quantity: string
	costPrice: string
	materialCode: string
	materialName: string
	uomCode: string
	minStock: string | null
}

function toEnrichedBalanceDto(row: EnrichedBalanceRow): StockBalanceDto {
	return {
		id: row.id,
		materialId: row.materialId,
		materialCode: row.materialCode,
		materialName: row.materialName,
		locationId: row.locationId,
		quantity: row.quantity,
		costPrice: row.costPrice,
		uomCode: row.uomCode,
		minStock: row.minStock,
	}
}

function toMovementDto(row: MovementRow): StockMovementDto {
	return {
		id: row.id,
		materialId: row.materialId,
		locationId: row.locationId,
		type: row.type,
		direction: row.direction,
		quantity: row.quantity,
		costPrice: row.costPrice,
		referenceType: row.referenceType,
		referenceId: row.referenceId,
		notes: row.notes,
		createdAt: row.createdAt,
		createdBy: row.createdBy,
	}
}

// ─── Implementation ───

export class StockRepo {
	constructor(readonly db: DbContext) {}

	async findBalance(
		materialId: number,
		locationId: number,
		db: Db = this.db,
	): Promise<StockBalanceDto | undefined> {
		const row = await db
			.select()
			.from(stockBalances)
			.where(
				and(eq(stockBalances.materialId, materialId), eq(stockBalances.locationId, locationId)),
			)
			.for('update')
			.limit(1)
			.then(takeFirst)
		return row ? toBalanceDto(row) : undefined
	}

	/** Unlocked batch read (no FOR UPDATE) for cost lookups. */
	async findBalances(
		materialIds: number[],
		locationId: number,
		db: Db = this.db,
	): Promise<StockBalanceDto[]> {
		if (materialIds.length === 0) return []
		const rows = await db
			.select()
			.from(stockBalances)
			.where(
				and(
					inArray(stockBalances.materialId, materialIds),
					eq(stockBalances.locationId, locationId),
				),
			)
		return rows.map(toBalanceDto)
	}

	async findBalancesByLocation(
		filter: StockBalanceFilterDto,
		db: Db = this.db,
	): Promise<WithPaginationResult<StockBalanceDto>> {
		const where = this.#buildBalanceWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: stockBalances.id,
				materialId: stockBalances.materialId,
				locationId: stockBalances.locationId,
				quantity: stockBalances.quantity,
				costPrice: stockBalances.costPrice,
				materialCode: materials.code,
				materialName: materials.name,
				uomCode: uoms.code,
				minStock: materials.minStock,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(stockBalances)
			.innerJoin(materials, eq(stockBalances.materialId, materials.id))
			.innerJoin(uoms, eq(materials.baseUomId, uoms.id))
			.where(where)
			.orderBy(sql`${materials.name} asc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toEnrichedBalanceDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async upsertBalance(
		materialId: number,
		locationId: number,
		quantity: string,
		costPrice: string,
		db: Db = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(stockBalances)
			.values({ materialId, locationId, quantity, costPrice })
			.onConflictDoUpdate({
				target: [stockBalances.materialId, stockBalances.locationId],
				set: { quantity, costPrice },
			})
			.returning({ id: stockBalances.id })
		return result
	}

	async insertMovement(data: MovementInsert, db: Db = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(stockMovements)
			.values(data)
			.returning({ id: stockMovements.id })
		return result
	}

	async findMovements(
		filter: StockMovementFilterDto,
		db: Db = this.db,
	): Promise<WithPaginationResult<StockMovementDto>> {
		const where = this.#buildMovementWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: stockMovements.id,
				materialId: stockMovements.materialId,
				locationId: stockMovements.locationId,
				type: stockMovements.type,
				direction: stockMovements.direction,
				quantity: stockMovements.quantity,
				costPrice: stockMovements.costPrice,
				referenceType: stockMovements.referenceType,
				referenceId: stockMovements.referenceId,
				notes: stockMovements.notes,
				createdAt: stockMovements.createdAt,
				createdBy: stockMovements.createdBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(stockMovements)
			.where(where)
			.orderBy(sql`${stockMovements.createdAt} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toMovementDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	// ─── Private ───

	#buildBalanceWhere(filter: StockBalanceFilterDto) {
		return allOf(
			eq(stockBalances.locationId, filter.locationId),
			eqIf(stockBalances.materialId, filter.materialId),
			searchAcross(filter.q, [materials.code, materials.name]),
			// Same predicates as the inventory summary counts, so a dashboard count
			// and the filtered list agree.
			filter.status === 'low'
				? sql`${materials.isActive} and ${materials.minStock} is not null and ${stockBalances.quantity} < ${materials.minStock}`
				: undefined,
			filter.status === 'negative' ? sql`${stockBalances.quantity} < 0` : undefined,
		)
	}

	#buildMovementWhere(filter: StockMovementFilterDto) {
		return allOf(
			eq(stockMovements.materialId, filter.materialId),
			eq(stockMovements.locationId, filter.locationId),
			eqIf(stockMovements.type, filter.type),
			eqIf(stockMovements.direction, filter.direction),
		)
	}
}
