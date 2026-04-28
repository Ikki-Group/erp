import { record } from '@elysiajs/opentelemetry'
import { and, eq, gte, inArray, isNull, lt, sql, sum } from 'drizzle-orm'

import { stampCreate } from '@/core/database'
import { toWibDateKey, toWibDayBounds } from '@/core/utils/date.util'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'
import { stockSummariesTable, stockTransactionsTable } from '@/db/schema'

import type { MaterialLocationService } from '@/modules/material'

import type {
	GenerateSummaryDto,
	StockLedgerFilterDto,
	StockLedgerSelectDto,
	StockSummaryFilterDto,
	StockSummarySelectDto,
} from './stock-summary.dto'
import { StockSummaryRepo } from './stock-summary.repo'

export class StockSummaryService {
	constructor(
		private readonly repo: StockSummaryRepo,
		private readonly mLocationSvc: MaterialLocationService,
	) {}

	/* --------------------------------- HANDLER -------------------------------- */

	/**
	 * List daily summaries for a location within a date range (paginated).
	 */
	async handleByLocation(
		filter: StockSummaryFilterDto,
	): Promise<WithPaginationResult<StockSummarySelectDto>> {
		return record('StockSummaryService.handleByLocation', async () => {
			return this.repo.getByLocationPaginated(filter)
		})
	}

	/**
	 * Monitor materialized stock ledger (konsolidasi & harian)
	 */
	async handleLedger(
		filter: StockLedgerFilterDto,
	): Promise<WithPaginationResult<StockLedgerSelectDto>> {
		return record('StockSummaryService.handleLedger', async () => {
			return this.repo.getLedgerPaginated(filter)
		})
	}

	/**
	 * Generate or regenerate daily summary for all materials at a location.
	 */
	async handleGenerate(
		data: GenerateSummaryDto,
		actorId: number,
	): Promise<{ generatedCount: number }> {
		return record('StockSummaryService.handleGenerate', async () => {
			const { locationId, date } = data
			const dateKey = toWibDateKey(date)
			const { start, end } = toWibDayBounds(date)

			const assignments = await this.mLocationSvc.findByLocationId(locationId)
			if (assignments.length === 0) return { generatedCount: 0 }

			const materialIds = assignments.map((a) => a.materialId)

			return await db.transaction(async (tx) => {
				const prevSummariesQuery = sql`
					SELECT DISTINCT ON ("materialId") "materialId", "closingQty", "closingAvgCost"
					FROM ${stockSummariesTable}
					WHERE "locationId" = ${locationId} AND "date" < ${dateKey.toISOString()}
						AND "materialId" IN ${materialIds}
						AND "deletedAt" IS NULL
					ORDER BY "materialId", "date" DESC
				`
				const prevSummariesRaw = (await tx.execute(prevSummariesQuery)) as unknown as {
					materialId: number
					closingQty: string
					closingAvgCost: string
				}[]
				const prevMap = new Map(prevSummariesRaw.map((r) => [r.materialId, r]))

				const movements = await tx
					.select({
						materialId: stockTransactionsTable.materialId,
						type: stockTransactionsTable.type,
						qty: sum(stockTransactionsTable.qty),
						totalCost: sum(stockTransactionsTable.totalCost),
					})
					.from(stockTransactionsTable)
					.where(
						and(
							isNull(stockTransactionsTable.deletedAt),
							eq(stockTransactionsTable.locationId, locationId),
							gte(stockTransactionsTable.date, start),
							lt(stockTransactionsTable.date, end),
							inArray(stockTransactionsTable.materialId, materialIds),
						),
					)
					.groupBy(stockTransactionsTable.materialId, stockTransactionsTable.type)

				const movementMap = new Map<number, typeof movements>()
				for (const m of movements) {
					const list = movementMap.get(m.materialId) ?? []
					list.push(m)
					movementMap.set(m.materialId, list)
				}

				const lastTransactionsQuery = sql`
					SELECT DISTINCT ON ("materialId") "materialId", "runningAvgCost"
					FROM ${stockTransactionsTable}
					WHERE "locationId" = ${locationId} AND "date" >= ${start.toISOString()} AND "date" < ${end.toISOString()}
						AND "materialId" IN ${materialIds}
						AND "deletedAt" IS NULL
					ORDER BY "materialId", "id" DESC
				`
				const lastTransactionsRaw = (await tx.execute(lastTransactionsQuery)) as unknown as {
					materialId: number
					runningAvgCost: string
				}[]
				const lastTxMap = new Map(lastTransactionsRaw.map((r) => [r.materialId, r]))

				const upsertData = assignments.map((assignment) => {
					const { materialId } = assignment
					const prev = prevMap.get(materialId)
					const openingQty = prev ? Number(prev.closingQty) : 0
					const openingAvgCost = prev ? Number(prev.closingAvgCost) : 0
					const openingValue = openingQty * openingAvgCost

					const materialMovements = movementMap.get(materialId) ?? []
					let purchaseQty = 0,
						purchaseValue = 0,
						transferInQty = 0,
						transferInValue = 0,
						transferOutQty = 0,
						transferOutValue = 0,
						adjustmentQty = 0,
						adjustmentValue = 0,
						usageQty = 0,
						usageValue = 0,
						productionInQty = 0,
						productionInValue = 0,
						productionOutQty = 0,
						productionOutValue = 0,
						sellQty = 0,
						sellValue = 0

					for (const m of materialMovements) {
						const qty = Number(m.qty ?? 0)
						const value = Number(m.totalCost ?? 0)
						switch (m.type) {
							case 'purchase':
								purchaseQty += qty
								purchaseValue += value
								break
							case 'transfer_in':
								transferInQty += qty
								transferInValue += value
								break
							case 'transfer_out':
								transferOutQty += qty
								transferOutValue += value
								break
							case 'adjustment':
								adjustmentQty += qty
								adjustmentValue += value
								break
							case 'sell':
								sellQty += qty
								sellValue += value
								break
							case 'usage':
								usageQty += qty
								usageValue += value
								break
							case 'production_in':
								productionInQty += qty
								productionInValue += value
								break
							case 'production_out':
								productionOutQty += qty
								productionOutValue += value
								break
						}
					}

					const closingQty =
						openingQty +
						purchaseQty +
						transferInQty -
						transferOutQty +
						adjustmentQty +
						(productionInQty - productionOutQty) -
						usageQty -
						sellQty
					const lastTx = lastTxMap.get(materialId)
					const closingAvgCost = lastTx ? Number(lastTx.runningAvgCost) : openingAvgCost
					const closingValue = closingQty * closingAvgCost

					return Object.assign(
						{
							materialId,
							locationId,
							date: dateKey,
							openingQty: openingQty.toString(),
							openingAvgCost: openingAvgCost.toString(),
							openingValue: openingValue.toString(),
							purchaseQty: purchaseQty.toString(),
							purchaseValue: purchaseValue.toString(),
							transferInQty: transferInQty.toString(),
							transferInValue: transferInValue.toString(),
							transferOutQty: transferOutQty.toString(),
							transferOutValue: transferOutValue.toString(),
							adjustmentQty: adjustmentQty.toString(),
							adjustmentValue: adjustmentValue.toString(),
							usageQty: usageQty.toString(),
							usageValue: usageValue.toString(),
							productionInQty: productionInQty.toString(),
							productionInValue: productionInValue.toString(),
							productionOutQty: productionOutQty.toString(),
							productionOutValue: productionOutValue.toString(),
							sellQty: sellQty.toString(),
							sellValue: sellValue.toString(),
							closingQty: closingQty.toString(),
							closingAvgCost: closingAvgCost.toString(),
							closingValue: closingValue.toString(),
						},
						stampCreate(actorId),
						{ updatedAt: new Date(), updatedBy: actorId },
					)
				})

				const generatedCount = await this.repo.upsertMany(upsertData)
				return { generatedCount }
			})
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('StockSummaryService.handleRemove', async () => {
			return this.repo.softDelete(id, actorId)
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('StockSummaryService.handleHardRemove', async () => {
			return this.repo.hardDelete(id)
		})
	}
}
