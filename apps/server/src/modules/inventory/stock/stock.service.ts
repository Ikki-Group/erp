import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import { record } from '@/infra/otel/otel.ts'
import { weightedAvgCost } from '@/shared/domain/costing.ts'
import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { EventBusPort } from '@/shared/events/event-bus.port.ts'
import type { StockMovementRecorded } from '@/shared/events/stock.events.ts'
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

export interface RecordedMovement extends EntityRef {
	event: StockMovementRecorded
}

export class StockService {
	private readonly cache: CacheService
	private readonly trackedCacheKeys = new Set<string>()

	constructor(
		private readonly repo: IStockRepo,
		cacheClient: CacheClient,
		private readonly assignmentService: AssignmentService,
		private readonly events: EventBusPort,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'inventory-stock')
	}

	// ─── Core Engine (called by other modules) ───

	async recordMovement(input: RecordMovementInput, db?: DbContext): Promise<RecordedMovement> {
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

			// Sales and production consumption are intentionally permissive. Every
			// other movement requires the material to be assigned at the location.
			if (type !== 'sales' && type !== 'production_out') {
				const assigned = await this.assignmentService.isAssigned(materialId, locationId, dbCtx)
				if (!assigned) throw StockError.materialNotAssigned(materialId, locationId)
			}

			const current = await this.repo.findBalance(materialId, locationId, dbCtx)
			const oldQty = Qty.of(current?.quantity ?? '0')
			const oldCost = Money.of(current?.costPrice ?? '0')
			const moveQty = Qty.of(qty)

			let newQty = oldQty
			let newCost = oldCost

			if (direction === 'in') {
				newQty = oldQty.add(moveQty)
				const costChanges =
					type === 'purchase_receipt' || type === 'transfer_in' || type === 'production_in'
				if (unitCost && costChanges) {
					newCost = weightedAvgCost(oldQty, oldCost, moveQty, Money.of(unitCost))
				}
			} else {
				if (type === 'transfer_out' && oldQty.lt(moveQty)) {
					throw StockError.insufficientStock(materialId, locationId, oldQty.toNumeric(), qty)
				}
				newQty = oldQty.sub(moveQty)
			}

			await this.repo.upsertBalance(
				materialId,
				locationId,
				newQty.toNumeric(),
				newCost.toCost(),
				dbCtx,
			)

			const movementResult = await this.repo.insertMovement(
				{
					materialId,
					locationId,
					type,
					direction,
					quantity: moveQty.toNumeric(),
					costPrice: newCost.toCost(),
					referenceType: referenceType ?? null,
					referenceId: referenceId ?? null,
					notes: notes ?? null,
					createdBy: actorId,
				},
				dbCtx,
			)
			if (!movementResult) throw StockError.movementFailed()

			const event: StockMovementRecorded = {
				type: 'StockMovementRecorded',
				movementId: movementResult.id,
				materialId,
				locationId,
				movementType: type,
				direction,
				quantity: moveQty.toNumeric(),
				costPrice: newCost.toCost(),
				referenceType: referenceType ?? null,
				referenceId: referenceId ?? null,
				actorId,
			}

			if (!db) {
				this.events.publish(event)
				await this.invalidateCache()
			}

			return { ...movementResult, event }
		})
	}

	async getBalance(
		materialId: number,
		locationId: number,
		db?: DbContext,
	): Promise<StockBalanceDto | undefined> {
		if (db) return this.repo.findBalance(materialId, locationId, db)
		return this.repo.findBalance(materialId, locationId)
	}
	async handleGetBalance(query: StockBalanceQueryDto): Promise<StockBalanceDto> {
		const balance = await this.cache.getOrSetWithSkip({
			key: this.#balanceCacheKey(query.materialId, query.locationId),
			factory: () => this.repo.findBalance(query.materialId, query.locationId),
		})
		if (!balance) throw StockError.balanceNotFound(query.materialId, query.locationId)
		return balance
	}

	async invalidateCache(): Promise<void> {
		const keys = [...this.trackedCacheKeys]
		this.trackedCacheKeys.clear()
		await this.cache.invalidateStandard()
		if (keys.length > 0) await this.cache.deleteFromKeys(keys)
	}

	async handleGetBalances(
		filter: StockBalanceFilterDto,
	): Promise<WithPaginationResult<StockBalanceDto>> {
		const key = `${this.cache.namespace}:balances:loc:${filter.locationId}:p${filter.page}:l${filter.limit}:m${filter.materialId ?? 'all'}`
		this.trackedCacheKeys.add(key)
		return this.cache.getOrSet({
			key,
			factory: () => this.repo.findBalancesByLocation(filter),
			ttl: BALANCE_TTL,
		})
	}

	async handleGetMovements(
		filter: StockMovementFilterDto,
	): Promise<WithPaginationResult<StockMovementDto>> {
		return this.repo.findMovements(filter)
	}

	#balanceCacheKey(materialId: number, locationId: number): string {
		const key = `${this.cache.namespace}:balance:${locationId}:${materialId}`
		this.trackedCacheKeys.add(key)
		return key
	}
}
