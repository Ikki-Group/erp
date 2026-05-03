/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { record } from '@elysiajs/opentelemetry'
import Decimal from 'decimal.js'
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	isNull,
	lte,
	or,
	sql,
	sum,
} from 'drizzle-orm'

import { paginate, type WithPaginationResult, type DbClient } from '@/core/database'
import { toWibDateKey } from '@/core/utils/date.util'

import { materialsTable, stockSummariesTable, uomsTable } from '@/db/schema'

import type {
	StockLedgerFilterDto,
	StockLedgerSelectDto,
	StockSummaryFilterDto,
	StockSummarySelectDto,
} from './stock-summary.dto'

export class StockSummaryRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getByLocationPaginated(
		filter: StockSummaryFilterDto,
	): Promise<WithPaginationResult<StockSummarySelectDto>> {
		return record('StockSummaryRepo.getByLocationPaginated', async () => {
			const { locationId, materialId, dateFrom, dateTo, page, limit } = filter

			const where = and(
				isNull(stockSummariesTable.deletedAt),
				eq(stockSummariesTable.locationId, locationId),
				materialId === undefined ? undefined : eq(stockSummariesTable.materialId, materialId),
				gte(stockSummariesTable.date, toWibDateKey(dateFrom)),
				lte(stockSummariesTable.date, toWibDateKey(dateTo)),
			)

			const result = await paginate({
				data: ({ limit: l, offset }) =>
					this.db
						.select({
							id: stockSummariesTable.id,
							materialId: stockSummariesTable.materialId,
							locationId: stockSummariesTable.locationId,
							date: stockSummariesTable.date,
							openingQty: stockSummariesTable.openingQty,
							openingAvgCost: stockSummariesTable.openingAvgCost,
							openingValue: stockSummariesTable.openingValue,
							purchaseQty: stockSummariesTable.purchaseQty,
							purchaseValue: stockSummariesTable.purchaseValue,
							transferInQty: stockSummariesTable.transferInQty,
							transferInValue: stockSummariesTable.transferInValue,
							transferOutQty: stockSummariesTable.transferOutQty,
							transferOutValue: stockSummariesTable.transferOutValue,
							adjustmentQty: stockSummariesTable.adjustmentQty,
							adjustmentValue: stockSummariesTable.adjustmentValue,
							usageQty: stockSummariesTable.usageQty,
							usageValue: stockSummariesTable.usageValue,
							productionInQty: stockSummariesTable.productionInQty,
							productionValue: stockSummariesTable.productionInValue,
							productionOutQty: stockSummariesTable.productionOutQty,
							productionOutValue: stockSummariesTable.productionOutValue,
							sellQty: stockSummariesTable.sellQty,
							sellValue: stockSummariesTable.sellValue,
							closingQty: stockSummariesTable.closingQty,
							closingAvgCost: stockSummariesTable.closingAvgCost,
							closingValue: stockSummariesTable.closingValue,
							createdAt: stockSummariesTable.createdAt,
							updatedAt: stockSummariesTable.updatedAt,
							createdBy: stockSummariesTable.createdBy,
							updatedBy: stockSummariesTable.updatedBy,
							syncAt: stockSummariesTable.syncAt,
							materialName: materialsTable.name,
							materialSku: materialsTable.sku,
						})
						.from(stockSummariesTable)
						.innerJoin(materialsTable, eq(stockSummariesTable.materialId, materialsTable.id))
						.where(where)
						.orderBy(desc(stockSummariesTable.date))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db
					.select({ count: count() })
					.from(stockSummariesTable)
					.innerJoin(materialsTable, eq(stockSummariesTable.materialId, materialsTable.id))
					.where(where),
			})

			return {
				data: result.data as unknown as StockSummarySelectDto[],
				meta: result.meta,
			}
		})
	}

	async getLedgerPaginated(
		filter: StockLedgerFilterDto,
	): Promise<WithPaginationResult<StockLedgerSelectDto>> {
		return record('StockSummaryRepo.getLedgerPaginated', async () => {
			const { locationId, materialId, dateFrom, dateTo, q, page, limit } = filter

			const startKey = toWibDateKey(dateFrom)
			const endKey = toWibDateKey(dateTo)

			// 1. Paginate Materials matching filter
			const matWhere = and(
				isNull(materialsTable.deletedAt),
				materialId === undefined ? undefined : eq(materialsTable.id, materialId),
				q
					? or(ilike(materialsTable.name, `%${q}%`), ilike(materialsTable.sku, `%${q}%`))
					: undefined,
			)

			const matResult = await paginate({
				data: ({ limit: l, offset }) =>
					this.db
						.select({
							id: materialsTable.id,
							name: materialsTable.name,
							sku: materialsTable.sku,
							baseUomCode: uomsTable.code,
						})
						.from(materialsTable)
						.innerJoin(uomsTable, eq(materialsTable.baseUomId, uomsTable.id))
						.where(matWhere)
						.orderBy(asc(materialsTable.name))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(materialsTable).where(matWhere),
			})

			if (matResult.data.length === 0) {
				return { data: [], meta: matResult.meta }
			}

			const materialIds = matResult.data.map((m) => m.id)
			const locFilter = locationId ? sql`AND "locationId" = ${locationId}` : sql``

			// A. Opening Qty
			const openingQuery = sql`
				SELECT "materialId", SUM("closingQty") as total_qty
				FROM (
					SELECT DISTINCT ON ("materialId", "locationId") "materialId", "closingQty"
					FROM stock_summaries
					WHERE "materialId" IN ${materialIds} AND "date" < ${startKey.toISOString()} ${locFilter}
						AND "deleted_at" IS NULL
					ORDER BY "materialId", "locationId", "date" DESC
				) latest
				GROUP BY "materialId"
			`
			const openingRaw = (await this.db.execute(openingQuery)) as unknown as {
				materialId: number
				total_qty: string
			}[]
			const openingMap = new Map(openingRaw.map((r) => [r.materialId, r.total_qty]))

			// B. Movements
			const movements = await this.db
				.select({
					materialId: stockSummariesTable.materialId,
					purchaseQty: sum(stockSummariesTable.purchaseQty),
					transferInQty: sum(stockSummariesTable.transferInQty),
					transferOutQty: sum(stockSummariesTable.transferOutQty),
					adjustmentQty: sum(stockSummariesTable.adjustmentQty),
					usageQty: sum(stockSummariesTable.usageQty),
					productionInQty: sum(stockSummariesTable.productionInQty),
					productionOutQty: sum(stockSummariesTable.productionOutQty),
					sellQty: sum(stockSummariesTable.sellQty),
				})
				.from(stockSummariesTable)
				.where(
					and(
						isNull(stockSummariesTable.deletedAt),
						inArray(stockSummariesTable.materialId, materialIds),
						locationId === undefined ? undefined : eq(stockSummariesTable.locationId, locationId),
						gte(stockSummariesTable.date, startKey),
						lte(stockSummariesTable.date, endKey),
					),
				)
				.groupBy(stockSummariesTable.materialId)

			const movementMap = new Map(movements.map((m) => [m.materialId, m]))

			// C. Closing Balance
			const closingQuery = sql`
				SELECT "materialId", SUM("closingQty") as total_qty, SUM("closingValue") as total_value
				FROM (
					SELECT DISTINCT ON ("materialId", "locationId") "materialId", "closingQty", "closingValue"
					FROM stock_summaries
					WHERE "materialId" IN ${materialIds} AND "date" <= ${endKey.toISOString()} ${locFilter}
						AND "deleted_at" IS NULL
					ORDER BY "materialId", "locationId", "date" DESC
				) latest
				GROUP BY "materialId"
			`
			const closingRaw = (await this.db.execute(closingQuery)) as unknown as {
				materialId: number
				total_qty: string
				total_value: string
			}[]
			const closingMap = new Map(closingRaw.map((r) => [r.materialId, r]))

			const data: StockLedgerSelectDto[] = matResult.data.map((m) => {
				const mv = movementMap.get(m.id)
				const cl = closingMap.get(m.id)

				const openingQty = new Decimal(openingMap.get(m.id) ?? 0)
				const purchaseQty = new Decimal(mv?.purchaseQty ?? 0)
				const transferInQty = new Decimal(mv?.transferInQty ?? 0)
				const transferOutQty = new Decimal(mv?.transferOutQty ?? 0)
				const adjustmentQty = new Decimal(mv?.adjustmentQty ?? 0)
				const sellQty = new Decimal(mv?.sellQty ?? 0)
				const usageQty = new Decimal(mv?.usageQty ?? 0)
				const productionInQty = new Decimal(mv?.productionInQty ?? 0)
				const productionOutQty = new Decimal(mv?.productionOutQty ?? 0)

				const closingQty = new Decimal(cl?.total_qty ?? 0)
				const closingValue = new Decimal(cl?.total_value ?? 0)
				const closingAvgCost = closingQty.isZero()
					? new Decimal(0)
					: closingValue.div(closingQty).abs()

				return {
					materialId: m.id,
					materialName: m.name,
					materialSku: m.sku,
					baseUomCode: m.baseUomCode,
					openingQty: openingQty.toString(),
					purchaseQty: purchaseQty.toString(),
					transferInQty: transferInQty.toString(),
					transferOutQty: transferOutQty.toString(),
					sellQty: sellQty.toString(),
					adjustmentQty: adjustmentQty.toString(),
					usageQty: usageQty.toString(),
					productionInQty: productionInQty.toString(),
					productionOutQty: productionOutQty.toString(),
					closingQty: closingQty.toString(),
					closingValue: closingValue.toString(),
					closingAvgCost: closingAvgCost.toString(),
				} as unknown as StockLedgerSelectDto
			})

			return { data, meta: matResult.meta }
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async upsertMany(data: (typeof stockSummariesTable.$inferInsert)[]): Promise<number> {
		return record('StockSummaryRepo.upsertMany', async () => {
			await this.db
				.insert(stockSummariesTable)
				.values(data)
				.onConflictDoUpdate({
					target: [
						stockSummariesTable.materialId,
						stockSummariesTable.locationId,
						stockSummariesTable.date,
					],
					targetWhere: isNull(stockSummariesTable.deletedAt),
					set: {
						openingQty: sql`excluded."openingQty"`,
						openingAvgCost: sql`excluded."openingAvgCost"`,
						openingValue: sql`excluded."openingValue"`,
						purchaseQty: sql`excluded."purchaseQty"`,
						purchaseValue: sql`excluded."purchaseValue"`,
						transferInQty: sql`excluded."transferInQty"`,
						transferInValue: sql`excluded."transferInValue"`,
						transferOutQty: sql`excluded."transferOutQty"`,
						transferOutValue: sql`excluded."transferOutValue"`,
						adjustmentQty: sql`excluded."adjustmentQty"`,
						adjustmentValue: sql`excluded."adjustmentValue"`,
						usageQty: sql`excluded."usageQty"`,
						usageValue: sql`excluded."usageValue"`,
						productionInQty: sql`excluded."productionInQty"`,
						productionInValue: sql`excluded."productionInValue"`,
						productionOutQty: sql`excluded."productionOutQty"`,
						productionOutValue: sql`excluded."productionOutValue"`,
						sellQty: sql`excluded."sellQty"`,
						sellValue: sql`excluded."sellValue"`,
						closingQty: sql`excluded."closingQty"`,
						closingAvgCost: sql`excluded."closingAvgCost"`,
						closingValue: sql`excluded."closingValue"`,
						updatedAt: sql`excluded."updatedAt"`,
						updatedBy: sql`excluded."updatedBy"`,
						deletedAt: null,
						deletedBy: null,
					},
				})
			return data.length
		})
	}

	async softDelete(id: number, actorId: number): Promise<{ id: number }> {
		return record('StockSummaryRepo.softDelete', async () => {
			await this.db
				.update(stockSummariesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(stockSummariesTable.id, id))
			return { id }
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('StockSummaryRepo.hardDelete', async () => {
			await this.db.delete(stockSummariesTable).where(eq(stockSummariesTable.id, id))
			return { id }
		})
	}
}
