/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, or, sql, sum } from 'drizzle-orm'

import { materialsTable, stockSummariesTable, uomsTable } from '@/db/schema'

import { paginate, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'
import { toWibDateKey } from '@/shared/utils/date'

import type {
	StockLedgerFilterDto,
	StockLedgerSelectDto,
	StockSummaryFilterDto,
	StockSummarySelectDto,
} from './stock-summary.contract'

type StockSummaryInsert = typeof stockSummariesTable.$inferInsert

export interface IStockSummaryRepo {
	readonly db: DbContext
	findByLocationPaginated(
		filter: StockSummaryFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<StockSummarySelectDto>>
	findLedgerPaginated(
		filter: StockLedgerFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<StockLedgerSelectDto>>
	insertMany(data: StockSummaryInsert[], db?: DbContext): Promise<number>
	softDelete(id: number, actorId: number, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class StockSummaryRepo implements IStockSummaryRepo {
	constructor(readonly db: DbContext) {}

	async findByLocationPaginated(
		filter: StockSummaryFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<StockSummarySelectDto>> {
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
				db
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
						productionInValue: stockSummariesTable.productionInValue,
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
			countQuery: () =>
				db
					.select({ count: count() })
					.from(stockSummariesTable)
					.innerJoin(materialsTable, eq(stockSummariesTable.materialId, materialsTable.id))
					.where(where),
		})

		return {
			data: result.data as unknown as StockSummarySelectDto[],
			meta: result.meta,
		}
	}

	async findLedgerPaginated(
		filter: StockLedgerFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<StockLedgerSelectDto>> {
		const { locationId, materialId, dateFrom, dateTo, q, page, limit } = filter

		const startKey = toWibDateKey(dateFrom)
		const endKey = toWibDateKey(dateTo)

		const matWhere = and(
			materialId === undefined ? undefined : eq(materialsTable.id, materialId),
			q ? or(ilike(materialsTable.name, `%${q}%`), ilike(materialsTable.sku, `%${q}%`)) : undefined,
		)

		const matResult = await paginate<{
			id: number
			name: string
			sku: string
			baseUomCode: string
		}>({
			data: ({ limit: l, offset }) =>
				db
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
			countQuery: () => db.select({ count: count() }).from(materialsTable).where(matWhere),
		})

		if (matResult.data.length === 0) {
			return { data: [], meta: matResult.meta }
		}

		const materialIds = matResult.data.map((m) => m.id)
		const locFilter = locationId ? sql`AND "locationId" = ${locationId}` : sql``

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
		const openingRaw = (await db.execute(openingQuery)) as unknown as {
			materialId: number
			total_qty: string
		}[]
		const openingMap = new Map(openingRaw.map((r) => [r.materialId, r.total_qty]))

		const movements = await db
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
		const closingRaw = (await db.execute(closingQuery)) as unknown as {
			materialId: number
			total_qty: string
			total_value: string
		}[]
		const closingMap = new Map(closingRaw.map((r) => [r.materialId, r]))

		const data: StockLedgerSelectDto[] = matResult.data.map((m) => {
			const mv = movementMap.get(m.id)
			const cl = closingMap.get(m.id)

			const openingQty = Number(openingMap.get(m.id) ?? 0)
			const purchaseQty = Number(mv?.purchaseQty ?? 0)
			const transferInQty = Number(mv?.transferInQty ?? 0)
			const transferOutQty = Number(mv?.transferOutQty ?? 0)
			const adjustmentQty = Number(mv?.adjustmentQty ?? 0)
			const sellQty = Number(mv?.sellQty ?? 0)
			const usageQty = Number(mv?.usageQty ?? 0)
			const productionInQty = Number(mv?.productionInQty ?? 0)
			const productionOutQty = Number(mv?.productionOutQty ?? 0)

			const closingQty = Number(cl?.total_qty ?? 0)
			const closingValue = Number(cl?.total_value ?? 0)
			const closingAvgCost = closingQty === 0 ? 0 : Math.abs(closingValue / closingQty)

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
	}

	async insertMany(data: StockSummaryInsert[], db: DbContext = this.db): Promise<number> {
		await db
			.insert(stockSummariesTable)
			.values(data)
			.onConflictDoUpdate({
				target: [stockSummariesTable.materialId, stockSummariesTable.locationId, stockSummariesTable.date],
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
	}

	async softDelete(id: number, actorId: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(stockSummariesTable)
			.set({ deletedAt: new Date(), deletedBy: actorId })
			.where(eq(stockSummariesTable.id, id))
			.returning({ id: stockSummariesTable.id })
		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(stockSummariesTable)
			.where(eq(stockSummariesTable.id, id))
			.returning({ id: stockSummariesTable.id })
		return res
	}
}
