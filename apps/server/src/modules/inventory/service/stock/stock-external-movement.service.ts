import { record } from '@elysiajs/opentelemetry'
import { db } from '@/db'
import { stampCreate } from '@/core/database'
import { stockTransactionsTable } from '@/db/schema'
import { MovementLogic } from './movement-logic'
import type {
  PurchaseTransactionDto,
  UsageTransactionDto,
  SellTransactionDto,
  ProductionInTransactionDto,
  ProductionOutTransactionDto,
  TransactionResultDto,
} from '@/modules/inventory/dto'

export class StockExternalMovementService extends MovementLogic {
  /**
   * Record purchase transactions for multiple materials at one location.
   */
  async handlePurchase(data: PurchaseTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return record('StockExternalMovementService.handlePurchase', async () => {
      const { locationId, date, referenceNo, notes, items } = data

      await db.transaction(async (tx) => {
        const metadata = stampCreate(actorId)

        for (const item of items) {
          const { materialId, qty, unitCost } = item

          await record(`StockExternalMovementService.handlePurchase.item:${materialId}`, async () => {
            const assignment = await this.mLocationSvc.findOne(materialId, locationId)

            const { newQty, newAvgCost } = this.calculateIncomingWAC(
              assignment.currentQty,
              assignment.currentAvgCost,
              qty,
              unitCost,
            )

            await tx
              .insert(stockTransactionsTable)
              .values({
                materialId,
                locationId,
                type: 'purchase',
                date,
                referenceNo,
                notes: notes ?? null,
                qty: qty.toString(),
                unitCost: unitCost.toString(),
                totalCost: (qty * unitCost).toString(),
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
   * Record production inputs (finished goods) at a location.
   */
  async handleProductionIn(data: ProductionInTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return record('StockExternalMovementService.handleProductionIn', async () => {
      const { locationId, date, referenceNo, notes, items } = data

      await db.transaction(async (tx) => {
        const metadata = stampCreate(actorId)

        for (const item of items) {
          const { materialId, qty, unitCost } = item

          await record(`StockExternalMovementService.handleProductionIn.item:${materialId}`, async () => {
            const assignment = await this.mLocationSvc.findOne(materialId, locationId)

            const { newQty, newAvgCost } = this.calculateIncomingWAC(
              assignment.currentQty,
              assignment.currentAvgCost,
              qty,
              unitCost,
            )

            await tx
              .insert(stockTransactionsTable)
              .values({
                materialId,
                locationId,
                type: 'production_in',
                date,
                referenceNo,
                notes: notes ?? null,
                qty: qty.toString(),
                unitCost: unitCost.toString(),
                totalCost: (qty * unitCost).toString(),
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

  async handleUsage(data: UsageTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return this.handleStockOut('usage', data, actorId)
  }

  async handleSell(data: SellTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return this.handleStockOut('sell', data, actorId)
  }

  async handleProductionOut(data: ProductionOutTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return this.handleStockOut('production_out', data, actorId)
  }
}
