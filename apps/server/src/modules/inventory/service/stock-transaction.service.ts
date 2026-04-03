import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'
import type { MaterialLocationService } from '@/modules/material/service/material-location.service'
import type { 
  AdjustmentTransactionDto, 
  PurchaseTransactionDto, 
  SellTransactionDto, 
  StockOpnameDto, 
  StockTransactionDto, 
  StockTransactionFilterDto, 
  StockTransactionSelectDto, 
  TransactionResultDto, 
  TransferTransactionDto, 
  UsageTransactionDto,
  ProductionInTransactionDto,
  ProductionOutTransactionDto
} from '@/modules/inventory/dto'
import { StockHistoryService } from './stock/stock-history.service'
import { StockExternalMovementService } from './stock/stock-external-movement.service'
import { StockInternalMovementService } from './stock/stock-internal-movement.service'

/**
 * StockTransactionService (Layer 2)
 * Primary facade for all inventory stock movements and history.
 * Modularized into sub-services (HARD-01) to comply with < 300 line limit.
 */
export class StockTransactionService {
  private readonly history: StockHistoryService
  private readonly external: StockExternalMovementService
  private readonly internal: StockInternalMovementService

  constructor(mLocationSvc: MaterialLocationService) {
    this.history = new StockHistoryService()
    this.external = new StockExternalMovementService(mLocationSvc)
    this.internal = new StockInternalMovementService(mLocationSvc)
  }

  /* ─────────────────────── READ OPERATIONS ─────────────────────── */

  async handleList(
    filter: StockTransactionFilterDto,
    pq: PaginationQuery,
  ): Promise<WithPaginationResult<StockTransactionSelectDto>> {
    return this.history.handleList(filter, pq)
  }

  async handleDetail(id: number): Promise<StockTransactionDto> {
    return this.history.handleDetail(id)
  }

  async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
    return this.history.handleRemove(id, actorId)
  }

  async handleHardRemove(id: number): Promise<{ id: number }> {
    return this.history.handleHardRemove(id)
  }

  /* ─────────────────────── WRITE OPERATIONS: EXTERNAL ─────────────────────── */

  async handlePurchase(data: PurchaseTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return this.external.handlePurchase(data, actorId)
  }

  async handleProductionIn(data: ProductionInTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return this.external.handleProductionIn(data, actorId)
  }

  async handleUsage(data: UsageTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return this.external.handleUsage(data, actorId)
  }

  async handleSell(data: SellTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return this.external.handleSell(data, actorId)
  }

  async handleProductionOut(data: ProductionOutTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return this.external.handleProductionOut(data, actorId)
  }

  /* ─────────────────────── WRITE OPERATIONS: INTERNAL ─────────────────────── */

  async handleTransfer(data: TransferTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return this.internal.handleTransfer(data, actorId)
  }

  async handleAdjustment(data: AdjustmentTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return this.internal.handleAdjustment(data, actorId)
  }

  async handleOpname(data: StockOpnameDto, actorId: number): Promise<TransactionResultDto> {
    return this.internal.handleOpname(data, actorId)
  }
}
