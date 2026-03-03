import { record } from '@elysiajs/opentelemetry'
import { Types, type PipelineStage } from 'mongoose'

import { PipelineBuilder, pipelineHelper, stampCreate } from '@/lib/db'
import { BadRequestError, NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import type { MaterialLocationService } from '@/modules/materials/service/material-location.service'

import { DB_NAME } from '@/config/db-name'

import {
  StockTransactionDto,
  StockTransactionSelectDto,
  type AdjustmentTransactionDto,
  type PurchaseTransactionDto,
  type StockTransactionFilterDto,
  type TransactionResultDto,
  type TransferTransactionDto,
} from '../dto'
import { StockTransactionModel } from '../model'

const err = {
  notFound: (id: ObjectId) => new NotFoundError(`Transaction with ID ${id} not found`, 'TRANSACTION_NOT_FOUND'),
  insufficientStock: (materialId: ObjectId, available: number, requested: number) =>
    new BadRequestError(
      `Insufficient stock for material ${materialId}: available ${available}, requested ${requested}`,
      'INSUFFICIENT_STOCK'
    ),
  negativeStock: (materialId: ObjectId) =>
    new BadRequestError(`Adjustment would result in negative stock for material ${materialId}`, 'NEGATIVE_STOCK'),
}

export class StockTransactionService {
  constructor(private readonly mLocationSvc: MaterialLocationService) {}

  /* ─────────────────────── WAC CALCULATION ─────────────────────── */

  /**
   * Weighted Average Cost calculation for incoming stock.
   * Formula: (currentQty * currentAvgCost + incomingQty * incomingUnitCost) / (currentQty + incomingQty)
   */
  private calculateIncomingWAC(
    currentQty: number,
    currentAvgCost: number,
    incomingQty: number,
    incomingUnitCost: number
  ): { newQty: number; newAvgCost: number } {
    const newQty = currentQty + incomingQty
    const newAvgCost = newQty > 0 ? (currentQty * currentAvgCost + incomingQty * incomingUnitCost) / newQty : 0

    return { newQty, newAvgCost }
  }

  /* ──────────────────── HANDLER: PURCHASE ──────────────────── */

  /**
   * Record purchase transactions for multiple materials at one location.
   * Each item increases stock and recalculates WAC.
   */
  async handlePurchase(data: PurchaseTransactionDto, actorId: ObjectId): Promise<TransactionResultDto> {
    return record('StockTransactionService.handlePurchase', async () => {
      const { locationId, date, referenceNo, notes, items } = data
      const stamp = stampCreate(actorId)

      for (const item of items) {
        // Validate assignment & get current stock
        const assignment = await this.mLocationSvc.findOne(item.materialId, locationId)

        // Calculate WAC
        const { newQty, newAvgCost } = this.calculateIncomingWAC(
          assignment.currentQty,
          assignment.currentAvgCost,
          item.qty,
          item.unitCost
        )
        const totalCost = item.qty * item.unitCost
        const newValue = newQty * newAvgCost

        // Create journal entry
        const transaction = new StockTransactionModel({
          materialId: item.materialId,
          locationId,
          type: 'purchase',
          date,
          referenceNo,
          notes: notes ?? null,
          qty: item.qty,
          unitCost: item.unitCost,
          totalCost,
          runningQty: newQty,
          runningAvgCost: newAvgCost,
          ...stamp,
        })

        await transaction.save()

        // Update live stock
        await this.mLocationSvc.updateCurrentStock(
          item.materialId,
          locationId,
          { currentQty: newQty, currentAvgCost: newAvgCost, currentValue: newValue },
          actorId
        )
      }

      return { count: items.length, referenceNo }
    })
  }

  /* ──────────────────── HANDLER: TRANSFER ──────────────────── */

  /**
   * Transfer multiple materials between two locations.
   * Creates paired journal entries (transfer_out + transfer_in) per item.
   * Transfer cost uses source location's current average cost.
   */
  async handleTransfer(data: TransferTransactionDto, actorId: ObjectId): Promise<TransactionResultDto> {
    return record('StockTransactionService.handleTransfer', async () => {
      const { sourceLocationId, destinationLocationId, date, referenceNo, notes, items } = data
      const transferId = new Types.ObjectId()
      const stamp = stampCreate(actorId)

      for (const item of items) {
        // Validate both assignments
        const sourceAssignment = await this.mLocationSvc.findOne(item.materialId, sourceLocationId)
        const destAssignment = await this.mLocationSvc.findOne(item.materialId, destinationLocationId)

        // Check sufficient stock at source
        if (sourceAssignment.currentQty < item.qty) {
          throw err.insufficientStock(item.materialId, sourceAssignment.currentQty, item.qty)
        }

        const transferCost = item.qty * sourceAssignment.currentAvgCost

        // ── Transfer OUT (source) — WAC unchanged ──
        const sourceNewQty = sourceAssignment.currentQty - item.qty
        const sourceAvgCost = sourceAssignment.currentAvgCost

        const transferOut = new StockTransactionModel({
          materialId: item.materialId,
          locationId: sourceLocationId,
          type: 'transfer_out',
          date,
          referenceNo,
          notes: notes ?? null,
          qty: item.qty,
          unitCost: sourceAvgCost,
          totalCost: transferCost,
          counterpartLocationId: destinationLocationId,
          transferId,
          runningQty: sourceNewQty,
          runningAvgCost: sourceAvgCost,
          ...stamp,
        })

        // ── Transfer IN (destination) — WAC recalculated ──
        const { newQty: destNewQty, newAvgCost: destNewAvgCost } = this.calculateIncomingWAC(
          destAssignment.currentQty,
          destAssignment.currentAvgCost,
          item.qty,
          sourceAvgCost
        )

        const transferIn = new StockTransactionModel({
          materialId: item.materialId,
          locationId: destinationLocationId,
          type: 'transfer_in',
          date,
          referenceNo,
          notes: notes ?? null,
          qty: item.qty,
          unitCost: sourceAvgCost,
          totalCost: transferCost,
          counterpartLocationId: sourceLocationId,
          transferId,
          runningQty: destNewQty,
          runningAvgCost: destNewAvgCost,
          ...stamp,
        })

        // Save both entries
        await Promise.all([transferOut.save(), transferIn.save()])

        // Update both locations' live stock
        await Promise.all([
          this.mLocationSvc.updateCurrentStock(
            item.materialId,
            sourceLocationId,
            { currentQty: sourceNewQty, currentAvgCost: sourceAvgCost, currentValue: sourceNewQty * sourceAvgCost },
            actorId
          ),
          this.mLocationSvc.updateCurrentStock(
            item.materialId,
            destinationLocationId,
            { currentQty: destNewQty, currentAvgCost: destNewAvgCost, currentValue: destNewQty * destNewAvgCost },
            actorId
          ),
        ])
      }

      return { count: items.length, referenceNo }
    })
  }

  /* ──────────────────── HANDLER: ADJUSTMENT ──────────────────── */

  /**
   * Record stock adjustments for multiple materials at one location.
   * - Positive qty: WAC recalculated (uses provided unitCost or current avg cost).
   * - Negative qty: WAC unchanged, stock reduced.
   */
  async handleAdjustment(data: AdjustmentTransactionDto, actorId: ObjectId): Promise<TransactionResultDto> {
    return record('StockTransactionService.handleAdjustment', async () => {
      const { locationId, date, referenceNo, notes, items } = data
      const stamp = stampCreate(actorId)

      for (const item of items) {
        const assignment = await this.mLocationSvc.findOne(item.materialId, locationId)

        let newQty: number
        let newAvgCost: number
        const effectiveUnitCost = item.unitCost ?? assignment.currentAvgCost

        if (item.qty > 0) {
          // Positive adjustment — recalculate WAC
          const result = this.calculateIncomingWAC(
            assignment.currentQty,
            assignment.currentAvgCost,
            item.qty,
            effectiveUnitCost
          )
          newQty = result.newQty
          newAvgCost = result.newAvgCost
        } else {
          // Negative adjustment — WAC unchanged
          newQty = assignment.currentQty + item.qty
          newAvgCost = assignment.currentAvgCost

          if (newQty < 0) throw err.negativeStock(item.materialId)
        }

        const totalCost = Math.abs(item.qty) * effectiveUnitCost
        const newValue = newQty * newAvgCost

        const transaction = new StockTransactionModel({
          materialId: item.materialId,
          locationId,
          type: 'adjustment',
          date,
          referenceNo,
          notes: notes ?? null,
          qty: item.qty,
          unitCost: effectiveUnitCost,
          totalCost,
          runningQty: newQty,
          runningAvgCost: newAvgCost,
          ...stamp,
        })

        await transaction.save()

        await this.mLocationSvc.updateCurrentStock(
          item.materialId,
          locationId,
          { currentQty: newQty, currentAvgCost: newAvgCost, currentValue: newValue },
          actorId
        )
      }

      return { count: items.length, referenceNo }
    })
  }

  /* ──────────────────── HANDLER: LIST ──────────────────── */

  /**
   * List transactions with filters (paginated), enriched with material info.
   */
  async handleList(
    filter: StockTransactionFilterDto,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<StockTransactionSelectDto>> {
    return record('StockTransactionService.handleList', async () => {
      const { locationId, materialId, type, search, dateFrom, dateTo } = filter

      const $match: PipelineStage.Match['$match'] = { locationId }
      if (materialId) $match.materialId = materialId
      if (type) $match.type = type
      if (dateFrom || dateTo) {
        $match.date = {}
        if (dateFrom) $match.date.$gte = dateFrom
        if (dateTo) $match.date.$lte = dateTo
      }

      const lookupMaterial = pipelineHelper.$lookup({
        from: DB_NAME.MATERIAL,
        localField: 'materialId',
        foreignField: '_id',
        as: 'material',
        let: { materialId: '$materialId' },
        pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$materialId'] } } }, { $project: { name: 1, sku: 1 } }],
      })

      const pb = PipelineBuilder.create(StockTransactionModel)
        .push(pipelineHelper.$match($match))
        .push(pipelineHelper.$sort({ date: -1 }))
        .push(lookupMaterial)
        .push(pipelineHelper.$unwind('$material'))

      // Apply search on material name/sku/referenceNo
      const pbWithSearch = search
        ? pb.push(
            pipelineHelper.$match({
              $or: [
                { 'material.name': { $regex: search, $options: 'i' } },
                { 'material.sku': { $regex: search, $options: 'i' } },
                { referenceNo: { $regex: search, $options: 'i' } },
              ],
            })
          )
        : pb

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

      return pbWithSearch.execPaginated({
        schema: StockTransactionSelectDto.array(),
        pq,
        facetAfter: [Projection, Cleanup],
      })
    })
  }

  /* ──────────────────── HANDLER: DETAIL ──────────────────── */

  /**
   * Get a single transaction by ID.
   */
  async handleDetail(id: ObjectId): Promise<StockTransactionDto> {
    return record('StockTransactionService.handleDetail', async () => {
      const result = await PipelineBuilder.create(StockTransactionModel)
        .push(pipelineHelper.$matchId(id), pipelineHelper.$setId())
        .execOne({ schema: StockTransactionDto })

      if (!result) throw err.notFound(id)
      return result
    })
  }
}
