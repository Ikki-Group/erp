import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import { record } from '@/infra/otel/otel.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { roundCost, roundQty, toDecimal, weightedAvgCost } from '@/shared/utils/money.ts'

import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'

import type {
	RecordMovementInput,
	StockBalanceDto,
	StockBalanceFilterDto,
	StockBalanceQueryDto,
	StockMovementDto,
	StockMovementFilterDto,
} from './stock.contract.ts'
import { StockError } from './stock.internal.ts'
import type { IStockRepo } from './stock.repo.ts'

// ─── Constants ───

const BALANCE_TTL = 10_000 // 10 seconds (Tier 3)

// ─── Service ───

export class StockService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IStockRepo,
		cacheClient: CacheClient,
		private readonly assignmentService: AssignmentService,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'inventory-stock')
	}

	// ─── Core Engine (called by other modules) ───

	async recordMovement(input: RecordMovementInput, db?: DbContext): Promise<EntityRef> {
		return record('stock.recordMovement', async () => {
			const {
				materialId,
				locationId,
				type,
				direction,
				qty,
				unitCost,
				referenceType,
				referenceId,
				notes,
				actorId,
			} = input
			const dbCtx = db ?? this.repo.db

			// 1. Validate material is assigned to location
			const assigned = await this.assignmentService.isAssigned(materialId, locationId)
			if (!assigned) {
				throw StockError.materialNotAssigned(materialId, locationId)
			}

			// 2. Get current balance (default zeros if first movement)
			const current = await this.repo.findBalance(materialId, locationId, dbCtx)
			const oldQty = toDecimal(current?.quantity ?? '0')
			const oldCost = toDecimal(current?.costPrice ?? '0')
			const moveQty = toDecimal(qty)

			// 3. Compute new balance using Decimal for precision
			let newQty = oldQty
			let newCost = oldCost

			if (direction === 'in') {
				newQty = oldQty.add(moveQty)
				// Weighted average cost recalculation on inbound
				if (unitCost && !newQty.isZero()) {
					const moveCost = toDecimal(unitCost)
					newCost = weightedAvgCost(oldQty, oldCost, moveQty, moveCost)
				}
			} else {
				// direction === 'out'
				if (oldQty.lt(moveQty)) {
					throw StockError.insufficientStock(materialId, locationId, oldQty.toString(), qty)
				}
				newQty = oldQty.sub(moveQty)
				// cost unchanged on outbound
			}

			// 4. Upsert balance
			await this.repo.upsertBalance(
				materialId,
				locationId,
				roundQty(newQty),
				roundCost(newCost),
				dbCtx,
			)

			// 5. Insert movement
			const movementResult = await this.repo.insertMovement(
				{
					materialId,
					locationId,
					type,
					direction,
					quantity: qty,
					costPrice: roundCost(newCost),
					referenceType: referenceType ?? null,
					referenceId: referenceId ?? null,
					notes: notes ?? null,
					createdBy: actorId,
				},
				dbCtx,
			)
			if (!movementResult) throw StockError.movementFailed()

			// 6. Invalidate cache
			await this.cache.invalidateStandard()
			await this.cache.deleteFromKeys([this.#balanceCacheKey(materialId, locationId)])

			return movementResult
		})
	}

	// ─── Read Handlers (route-facing) ───

	async handleGetBalance(query: StockBalanceQueryDto): Promise<StockBalanceDto> {
		const balance = await this.cache.getOrSetWithSkip({
			key: this.#balanceCacheKey(query.materialId, query.locationId),
			factory: () => this.repo.findBalance(query.materialId, query.locationId),
		})
		if (!balance) {
			throw StockError.balanceNotFound(query.materialId, query.locationId)
		}
		return balance
	}

	async handleGetBalances(
		filter: StockBalanceFilterDto,
	): Promise<WithPaginationResult<StockBalanceDto>> {
		return this.cache.getOrSet({
			key: `${this.cache.namespace}:balances:loc:${filter.locationId}:p${filter.page}:l${filter.limit}:m${filter.materialId ?? 'all'}`,
			factory: () => this.repo.findBalancesByLocation(filter),
			ttl: BALANCE_TTL,
		})
	}

	async handleGetMovements(
		filter: StockMovementFilterDto,
	): Promise<WithPaginationResult<StockMovementDto>> {
		// Movements are append-only, no cache needed (Tier 3 — fresh reads)
		return this.repo.findMovements(filter)
	}

	// ─── Private ───

	#balanceCacheKey(materialId: number, locationId: number): string {
		return `${this.cache.namespace}:balance:${locationId}:${materialId}`
	}
}
