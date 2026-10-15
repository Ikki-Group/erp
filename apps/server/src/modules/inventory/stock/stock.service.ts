import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import { record } from '@/infra/otel/otel.ts'
import { weightedAvgCost } from '@/shared/domain/costing.ts'
import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'

import type {
	BalanceKey,
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
const CACHE_NS = 'inventory-stock'
/** Tag on every cached balance read; lets invalidation free entries of old generations. */
const BALANCE_TAG = 'stock:balance'
/**
 * Balance cache keys embed a generation that every invalidation replaces. A read reads the
 * generation BEFORE querying the DB, so a read that races a commit writes under the old
 * generation, which no later read looks up — closing the stale-after-invalidate window.
 */
const BALANCE_GEN_KEY = `${CACHE_NS}:balance:gen`

// ─── Service ───

export interface RecordedMovement extends EntityRef {
	/** Weighted-average cost after this movement. */
	costPrice: string
}

export class StockService {
	constructor(
		private readonly repo: IStockRepo,
		private readonly cache: CacheClient,
		private readonly assignmentService: AssignmentService,
	) {}

	// ─── Core Engine (called by other modules) ───

	/**
	 * Records one movement and updates its balance under a row lock. With `db`,
	 * runs inside the caller's transaction (caller invalidates after
	 * commit); without it, opens its own transaction so the lock is effective.
	 */
	async recordMovement(input: RecordMovementInput, db?: DbContext): Promise<RecordedMovement> {
		return record('stock.recordMovement', async () => {
			if (db) return this.#applyMovement(input, db)

			const recorded = await this.repo.db.transaction((tx) => this.#applyMovement(input, tx))
			await this.invalidateCache()
			return recorded
		})
	}

	/**
	 * Locks (creating when absent) every balance row a multi-movement
	 * transaction will touch, in canonical (locationId, materialId) order, so
	 * concurrent transactions cannot deadlock on each other's balances.
	 */
	async lockBalances(keys: readonly BalanceKey[], db: DbContext): Promise<void> {
		await this.repo.lockBalances(keys, db)
	}

	async #applyMovement(input: RecordMovementInput, dbCtx: DbContext): Promise<RecordedMovement> {
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

		// Sales and production consumption are intentionally permissive. Every
		// other movement requires the material to be assigned at the location.
		if (type !== 'sales' && type !== 'production_out') {
			const assigned = await this.assignmentService.isAssigned(materialId, locationId, dbCtx)
			if (!assigned) throw StockError.materialNotAssigned(materialId, locationId)
		}

		// Inserts a zero row when absent so concurrent first movements serialize.
		const current = await this.repo.lockBalance(materialId, locationId, dbCtx)
		if (!current) throw StockError.balanceNotFound(materialId, locationId)
		const oldQty = Qty.of(current.quantity)
		const oldCost = Money.of(current.costPrice)
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

		return { ...movementResult, costPrice: newCost.toCost() }
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
		const gen = await this.#balanceGeneration()
		const balance = await this.cache.getOrSet({
			key: `${CACHE_NS}:balance:${gen}:${query.locationId}:${query.materialId}`,
			// Missing balances are not cached: the first movement creates the row.
			factory: async (ctx) =>
				(await this.repo.findBalance(query.materialId, query.locationId)) ?? ctx.skip(),
			tags: [BALANCE_TAG],
		})
		if (!balance) throw StockError.balanceNotFound(query.materialId, query.locationId)
		return balance
	}

	async invalidateCache(): Promise<void> {
		await this.cache.set({ key: BALANCE_GEN_KEY, value: crypto.randomUUID() })
		await this.cache.deleteByTag({ tags: [BALANCE_TAG] })
	}

	#balanceGeneration(): Promise<string> {
		return this.cache.getOrSet({ key: BALANCE_GEN_KEY, factory: () => crypto.randomUUID() })
	}

	async handleGetBalances(
		filter: StockBalanceFilterDto,
	): Promise<WithPaginationResult<StockBalanceDto>> {
		const gen = await this.#balanceGeneration()
		return this.cache.getOrSet({
			key: `${CACHE_NS}:balances:${gen}:loc:${filter.locationId}:p${filter.page}:l${filter.limit}:m${filter.materialId ?? 'all'}`,
			factory: () => this.repo.findBalancesByLocation(filter),
			ttl: BALANCE_TTL,
			tags: [BALANCE_TAG],
		})
	}

	async handleGetMovements(
		filter: StockMovementFilterDto,
	): Promise<WithPaginationResult<StockMovementDto>> {
		return this.repo.findMovements(filter)
	}
}
