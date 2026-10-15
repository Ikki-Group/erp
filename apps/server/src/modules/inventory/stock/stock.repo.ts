import { stockBalances, stockMovements } from '@/db/schema/inventory.ts'
import { materials } from '@/db/schema/material.ts'
import { uoms } from '@/db/schema/uom.ts'

import {
	allOf,
	anyOf,
	asc,
	eq,
	eqIf,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
	and,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import { compareBalanceKeys } from './stock.contract.ts'
import type {
	BalanceKey,
	StockBalanceDto,
	StockBalanceFilterDto,
	StockMovementDto,
	StockMovementFilterDto,
} from './stock.contract.ts'

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

// ─── Interface ───

export interface IStockRepo {
	readonly db: DbContext
	findBalance(
		materialId: number,
		locationId: number,
		db?: DbContext,
	): Promise<StockBalanceDto | undefined>
	/**
	 * Locks the balance row for update, creating a zero row first when absent so
	 * that concurrent first movements serialize on the same row.
	 */
	lockBalance(
		materialId: number,
		locationId: number,
		db: DbContext,
	): Promise<StockBalanceDto | undefined>
	/** Locks (creating when absent) many balance rows in canonical key order. */
	lockBalances(keys: readonly BalanceKey[], db: DbContext): Promise<void>
	findBalancesByLocation(
		filter: StockBalanceFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<StockBalanceDto>>
	upsertBalance(
		materialId: number,
		locationId: number,
		quantity: string,
		costPrice: string,
		db?: DbContext,
	): Promise<EntityRef | undefined>
	insertMovement(data: MovementInsert, db?: DbContext): Promise<EntityRef | undefined>
	findMovements(
		filter: StockMovementFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<StockMovementDto>>
}

// ─── Implementation ───

export class StockRepo implements IStockRepo {
	constructor(readonly db: DbContext) {}

	async lockBalance(
		materialId: number,
		locationId: number,
		db: DbContext,
	): Promise<StockBalanceDto | undefined> {
		await db
			.insert(stockBalances)
			.values({ materialId, locationId })
			.onConflictDoNothing({ target: [stockBalances.materialId, stockBalances.locationId] })
		const row = await db
			.select()
			.from(stockBalances)
			.where(
				and(eq(stockBalances.materialId, materialId), eq(stockBalances.locationId, locationId)),
			)
			.for('update')
			.then(takeFirst)
		return row ? toBalanceDto(row) : undefined
	}

	async lockBalances(keys: readonly BalanceKey[], db: DbContext): Promise<void> {
		const unique = new Map<string, BalanceKey>()
		for (const key of keys) unique.set(`${key.locationId}:${key.materialId}`, key)
		if (unique.size === 0) return
		const sorted = [...unique.values()].toSorted(compareBalanceKeys)

		// VALUES rows are inserted in list order, so waits on concurrently inserted
		// rows also follow the canonical order.
		await db
			.insert(stockBalances)
			.values(sorted.map(({ materialId, locationId }) => ({ materialId, locationId })))
			.onConflictDoNothing({ target: [stockBalances.materialId, stockBalances.locationId] })
		// LockRows sits above Sort, so rows are locked in ORDER BY order.
		await db
			.select({ id: stockBalances.id })
			.from(stockBalances)
			.where(
				anyOf(
					...sorted.map((key) =>
						and(
							eq(stockBalances.materialId, key.materialId),
							eq(stockBalances.locationId, key.locationId),
						),
					),
				),
			)
			.orderBy(asc(stockBalances.locationId), asc(stockBalances.materialId))
			.for('update')
	}

	async findBalance(
		materialId: number,
		locationId: number,
		db: DbContext = this.db,
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

	async findBalancesByLocation(
		filter: StockBalanceFilterDto,
		db: DbContext = this.db,
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
		db: DbContext = this.db,
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

	async insertMovement(
		data: MovementInsert,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(stockMovements)
			.values(data)
			.returning({ id: stockMovements.id })
		return result
	}

	async findMovements(
		filter: StockMovementFilterDto,
		db: DbContext = this.db,
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
