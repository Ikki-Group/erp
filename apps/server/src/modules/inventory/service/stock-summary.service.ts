import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage } from 'mongoose'

import { PipelineBuilder, pipelineHelper, stampCreate, stampUpdate } from '@/lib/db'
import { toWibDateKey, toWibDayBounds } from '@/lib/utils/date.util'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import type { MaterialLocationService } from '@/modules/materials/service/material-location.service'

import { DB_NAME } from '@/config/db-name'

import { StockSummarySelectDto, type GenerateSummaryDto, type StockSummaryFilterDto } from '../dto'
import { StockSummaryModel, StockTransactionModel } from '../model'

export class StockSummaryService {
  constructor(private readonly mLocationSvc: MaterialLocationService) {}

  /* ──────────────────── HANDLER: SUMMARY BY LOCATION ──────────────────── */

  /**
   * List daily summaries for a location within a date range (paginated).
   * Each row = one material on one day.
   */
  async handleByLocation(
    filter: StockSummaryFilterDto,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<StockSummarySelectDto>> {
    return record('StockSummaryService.handleByLocation', async () => {
      const { locationId, materialId, dateFrom, dateTo } = filter

      const $match: PipelineStage.Match['$match'] = {
        locationId,
        date: {
          $gte: toWibDateKey(dateFrom),
          $lte: toWibDateKey(dateTo),
        },
      }
      if (materialId) $match.materialId = materialId

      const lookupMaterial = pipelineHelper.$lookup({
        from: DB_NAME.MATERIAL,
        localField: 'materialId',
        foreignField: '_id',
        as: 'material',
        let: { materialId: '$materialId' },
        pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$materialId'] } } }, { $project: { name: 1, sku: 1 } }],
      })

      const pb = PipelineBuilder.create(StockSummaryModel)
        .push(pipelineHelper.$match($match))
        .push(pipelineHelper.$sort({ date: -1 }))
        .push(lookupMaterial)
        .push(pipelineHelper.$unwind('$material'))

      const Projection = {
        $set: {
          id: '$_id',
          materialName: '$material.name',
          materialSku: '$material.sku',
        },
      }

      const Cleanup: PipelineStage.FacetPipelineStage = {
        $project: { _id: 0, __v: 0, material: 0 },
      }

      return pb.execPaginated({
        schema: StockSummarySelectDto.array(),
        pq,
        facetAfter: [Projection, Cleanup],
      })
    })
  }

  /* ──────────────────── HANDLER: GENERATE DAILY SUMMARY ──────────────────── */

  /**
   * Generate or regenerate daily summary for all materials at a location.
   * Aggregates transactions within the WIB day and computes opening/closing balances.
   */
  async handleGenerate(data: GenerateSummaryDto, actorId: ObjectId): Promise<{ generatedCount: number }> {
    return record('StockSummaryService.handleGenerate', async () => {
      const { locationId, date } = data
      const dateKey = toWibDateKey(date)
      const { start, end } = toWibDayBounds(date)

      // Get all material assignments for this location
      const assignments = await this.mLocationSvc.findByLocationId(locationId)
      if (assignments.length === 0) return { generatedCount: 0 }

      let generatedCount = 0

      for (const assignment of assignments) {
        const { materialId } = assignment

        // Get previous day's closing (= today's opening)
        const previousSummary = await StockSummaryModel.findOne({
          materialId,
          locationId,
          date: { $lt: dateKey },
        }).sort({ date: -1 })

        const openingQty = previousSummary?.closingQty ?? 0
        const openingAvgCost = previousSummary?.closingAvgCost ?? 0
        const openingValue = openingQty * openingAvgCost

        // Aggregate transactions for this material+location on this WIB day
        const [movements] = await StockTransactionModel.aggregate([
          {
            $match: {
              materialId,
              locationId,
              date: { $gte: start, $lt: end },
            },
          },
          {
            $group: {
              _id: null,
              purchaseQty: { $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, '$qty', 0] } },
              purchaseValue: { $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, '$totalCost', 0] } },
              transferInQty: { $sum: { $cond: [{ $eq: ['$type', 'transfer_in'] }, '$qty', 0] } },
              transferInValue: { $sum: { $cond: [{ $eq: ['$type', 'transfer_in'] }, '$totalCost', 0] } },
              transferOutQty: { $sum: { $cond: [{ $eq: ['$type', 'transfer_out'] }, '$qty', 0] } },
              transferOutValue: { $sum: { $cond: [{ $eq: ['$type', 'transfer_out'] }, '$totalCost', 0] } },
              adjustmentQty: { $sum: { $cond: [{ $eq: ['$type', 'adjustment'] }, '$qty', 0] } },
              adjustmentValue: { $sum: { $cond: [{ $eq: ['$type', 'adjustment'] }, '$totalCost', 0] } },
              sellQty: { $sum: { $cond: [{ $eq: ['$type', 'sell'] }, '$qty', 0] } },
              sellValue: { $sum: { $cond: [{ $eq: ['$type', 'sell'] }, '$totalCost', 0] } },
            },
          },
        ])

        const purchaseQty = movements?.purchaseQty ?? 0
        const purchaseValue = movements?.purchaseValue ?? 0
        const transferInQty = movements?.transferInQty ?? 0
        const transferInValue = movements?.transferInValue ?? 0
        const transferOutQty = movements?.transferOutQty ?? 0
        const transferOutValue = movements?.transferOutValue ?? 0
        const adjustmentQty = movements?.adjustmentQty ?? 0
        const adjustmentValue = movements?.adjustmentValue ?? 0
        const sellQty = movements?.sellQty ?? 0
        const sellValue = movements?.sellValue ?? 0

        // Calculate closing balance
        const closingQty = openingQty + purchaseQty + transferInQty - transferOutQty + adjustmentQty - sellQty

        // Get the last transaction's running avg cost for the day, or use opening if no transactions
        const lastTransaction = await StockTransactionModel.findOne({
          materialId,
          locationId,
          date: { $gte: start, $lt: end },
        }).sort({ _id: -1 })

        const closingAvgCost = lastTransaction?.runningAvgCost ?? openingAvgCost
        const closingValue = closingQty * closingAvgCost

        // Upsert summary
        const stamp = await StockSummaryModel.findOne({ materialId, locationId, date: dateKey })
        if (stamp) {
          await StockSummaryModel.findByIdAndUpdate(stamp._id, {
            openingQty,
            openingAvgCost,
            openingValue,
            purchaseQty,
            purchaseValue,
            transferInQty,
            transferInValue,
            transferOutQty,
            transferOutValue,
            adjustmentQty,
            adjustmentValue,
            sellQty,
            sellValue,
            closingQty,
            closingAvgCost,
            closingValue,
            ...stampUpdate(actorId),
          })
        } else {
          const doc = new StockSummaryModel({
            materialId,
            locationId,
            date: dateKey,
            openingQty,
            openingAvgCost,
            openingValue,
            purchaseQty,
            purchaseValue,
            transferInQty,
            transferInValue,
            transferOutQty,
            transferOutValue,
            adjustmentQty,
            adjustmentValue,
            sellQty,
            sellValue,
            closingQty,
            closingAvgCost,
            closingValue,
            ...stampCreate(actorId),
          })
          await doc.save()
        }

        generatedCount++
      }

      return { generatedCount }
    })
  }
}
