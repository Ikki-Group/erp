import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

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
		const { materialId, locationId, type, direction, qty, unitCost, referenceType, referenceId, notes, actorId } = input
		const dbCtx = db ?? this.repo.db

		// 1. Validate material is assigned to location
		const assigned = await this.assignmentService.isAssigned(materialId, locationId)
		if (!assigned) {
			throw StockError.materialNotAssigned(materialId, locationId)
		}

		// 2. Get current balance (default zeros if first movement)
		const current = await this.repo.findBalance(materialId, locationId, dbCtx)
		const oldQty = parseFloat(current?.quantity ?? '0')
		const oldCost = parseFloat(current?.costPrice ?? '0')
		const moveQty = parseFloat(qty)

		// 3. Compute new balance
		let newQty: number
		let newCost: number

		if (direction === 'in') {
			newQty = oldQty + moveQty
			// Weighted average cost recalculation on inbound
			if (unitCost && newQty > 0) {
				const moveCost = parseFloat(unitCost)
				newCost = ((oldQty * oldCost) + (moveQty * moveCost)) / newQty
			} else {
				newCost = oldCost
			}
		} else {
			// direction === 'out'
			if (oldQty < moveQty) {
				throw StockError.insufficientStock(materialId, locationId, String(oldQty), qty)
			}
			newQty = oldQty - moveQty
			newCost = oldCost // cost unchanged on outbound
		}

		// 4. Upsert balance
		await this.repo.upsertBalance(
			materialId,
			locationId,
			newQty.toFixed(6),
			newCost.toFixed(6),
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
				costPrice: newCost.toFixed(6),
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

	async handleGetBalances(filter: StockBalanceFilterDto): Promise<WithPaginationResult<StockBalanceDto>> {
		return this.cache.getOrSet({
			key: `${this.cache.namespace}:balances:loc:${filter.locationId}:p${filter.page}:l${filter.limit}:m${filter.materialId ?? 'all'}`,
			factory: () => this.repo.findBalancesByLocation(filter),
			ttl: BALANCE_TTL,
		})
	}

	async handleGetMovements(filter: StockMovementFilterDto): Promise<WithPaginationResult<StockMovementDto>> {
		// Movements are append-only, no cache needed (Tier 3 — fresh reads)
		return this.repo.findMovements(filter)
	}

	// ─── Private ───

	#balanceCacheKey(materialId: number, locationId: number): string {
		return `${this.cache.namespace}:balance:${locationId}:${materialId}`
	}
}
