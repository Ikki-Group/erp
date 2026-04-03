import { record } from '@elysiajs/opentelemetry'
import { db } from '@/db'
import { stampCreate } from '@/core/database'
import { stockTransactionsTable } from '@/db/schema'
import { MovementLogic } from './movement-logic'
import { BadRequestError } from '@/core/http/errors'
import type { 
  TransferTransactionDto, 
  AdjustmentTransactionDto, 
  StockOpnameDto,
  TransactionResultDto
} from '@/modules/inventory/dto'

export class StockInternalMovementService extends MovementLogic {
  /**
   * Transfer multiple materials between two locations.
   */
  async handleTransfer(data: TransferTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return record('StockInternalMovementService.handleTransfer', async () => {
      const { sourceLocationId, destinationLocationId, date, referenceNo, notes, items } = data
      const transferId = Math.floor(Date.now() / 1000)

      await db.transaction(async (tx) => {
        const metadata = stampCreate(actorId)

        for (const item of items) {
          const { materialId, qty } = item

          await record(`StockInternalMovementService.handleTransfer.item:${materialId}`, async () => {
            const sourceAssignment = await this.mLocationSvc.findOne(materialId, sourceLocationId)
            const destAssignment = await this.mLocationSvc.findOne(materialId, destinationLocationId)

            if (sourceAssignment.currentQty < qty) {
              throw new BadRequestError(`Insufficient stock for material ${materialId} at source: available ${sourceAssignment.currentQty}, requested ${qty}`)
            }

            const transferCost = qty * sourceAssignment.currentAvgCost

            // ── Transfer OUT (Delegating to Logic)
            await this.handleStockOut('transfer_out', {
              locationId: sourceLocationId,
              date,
              referenceNo,
              notes,
              items: [{ materialId, qty }],
              counterpartLocationId: destinationLocationId,
              transferId
            }, actorId, tx)

            // ── Transfer IN
            const { newQty, newAvgCost } = this.calculateIncomingWAC(
              destAssignment.currentQty,
              destAssignment.currentAvgCost,
              qty,
              sourceAssignment.currentAvgCost,
            )

            await tx.insert(stockTransactionsTable).values({
              materialId,
              locationId: destinationLocationId,
              type: 'transfer_in',
              date,
              referenceNo,
              notes: notes ?? null,
              qty: qty.toString(),
              unitCost: sourceAssignment.currentAvgCost.toString(),
              totalCost: transferCost.toString(),
              counterpartLocationId: sourceLocationId,
              transferId,
              runningQty: newQty.toString(),
              runningAvgCost: newAvgCost.toString(),
              ...metadata,
            })

            await this.mLocationSvc.updateCurrentStock(
              materialId,
              destinationLocationId,
              { currentQty: newQty, currentAvgCost: newAvgCost, currentValue: newQty * newAvgCost },
              actorId,
            )
          })
        }
      })

      return { count: items.length, referenceNo }
    })
  }

  /**
   * Record Stock Opname (Physical Count Reconciliation).
   */
  async handleOpname(data: StockOpnameDto, actorId: number): Promise<TransactionResultDto> {
    return record('StockInternalMovementService.handleOpname', async () => {
      const { locationId, date, referenceNo, notes, items } = data

      await db.transaction(async (tx) => {
        const metadata = stampCreate(actorId)

        for (const item of items) {
          const { materialId, physicalQty } = item

          await record(`StockInternalMovementService.handleOpname.item:${materialId}`, async () => {
            const assignment = await this.mLocationSvc.findOne(materialId, locationId)
            const diffQty = physicalQty - assignment.currentQty

            if (diffQty === 0) return

            const { newQty, newAvgCost } = diffQty > 0 
              ? this.calculateIncomingWAC(assignment.currentQty, assignment.currentAvgCost, diffQty, assignment.currentAvgCost)
              : { newQty: physicalQty, newAvgCost: assignment.currentAvgCost }

            await tx.insert(stockTransactionsTable).values({
              materialId,
              locationId,
              type: 'adjustment',
              date,
              referenceNo,
              notes: `Stock Opname: ${notes ?? ''}`.trim(),
              qty: diffQty.toString(),
              unitCost: assignment.currentAvgCost.toString(),
              totalCost: (Math.abs(diffQty) * assignment.currentAvgCost).toString(),
              runningQty: newQty.toString(),
              runningAvgCost: newAvgCost.toString(),
              ...metadata,
            })

            await this.mLocationSvc.updateCurrentStock(
              materialId,
              locationId,
              { currentQty: newQty, currentAvgCost: newAvgCost, currentValue: newQty * newAvgCost },
              actorId,
            )
          })
        }
      })

      return { count: items.length, referenceNo }
    })
  }

  /**
   * Generic manual stock adjustment.
   */
  async handleAdjustment(data: AdjustmentTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return record('StockInternalMovementService.handleAdjustment', async () => {
      const { locationId, date, referenceNo, notes, items } = data

      await db.transaction(async (tx) => {
        const metadata = stampCreate(actorId)

        for (const item of items) {
          const { materialId, qty } = item

          await record(`StockInternalMovementService.handleAdjustment.item:${materialId}`, async () => {
            const assignment = await this.mLocationSvc.findOne(materialId, locationId)
            const effectiveUnitCost = item.unitCost ?? assignment.currentAvgCost

            const { newQty, newAvgCost } = qty > 0 
              ? this.calculateIncomingWAC(assignment.currentQty, assignment.currentAvgCost, qty, effectiveUnitCost)
              : { newQty: assignment.currentQty + qty, newAvgCost: assignment.currentAvgCost }

            if (newQty < 0) throw new BadRequestError(`Adjustment results in negative stock for material ${materialId}`)

            await tx.insert(stockTransactionsTable).values({
              materialId,
              locationId,
              type: 'adjustment',
              date,
              referenceNo,
              notes: notes ?? null,
              qty: qty.toString(),
              unitCost: effectiveUnitCost.toString(),
              totalCost: (Math.abs(qty) * effectiveUnitCost).toString(),
              runningQty: newQty.toString(),
              runningAvgCost: newAvgCost.toString(),
              ...metadata,
            })

            await this.mLocationSvc.updateCurrentStock(
              materialId,
              locationId,
              { currentQty: newQty, currentAvgCost: newAvgCost, currentValue: newQty * newAvgCost },
              actorId,
            )
          })
        }
      })
      return { count: items.length, referenceNo }
    })
  }
}
