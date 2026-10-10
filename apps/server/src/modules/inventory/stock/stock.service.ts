import type { Db } from '@/infra/database/index.ts'
import { record } from '@/infra/otel/otel.ts'
import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { MaterialAssignmentService } from '@/modules/material/index.ts'

import { applyMovement } from './stock.calculator.ts'
import type {
	RecordMovementInput,
	StockBalanceDto,
	StockBalanceFilterDto,
	StockBalanceQueryDto,
	StockMovementDto,
	StockMovementFilterDto,
} from './stock.contract.ts'
import { StockError } from './stock.internal.ts'
import type { StockRepo } from './stock.repo.ts'

interface Deps extends Infra {
	repo: StockRepo
	assignment: Pick<MaterialAssignmentService, 'isAssigned'>
}

export interface RecordedMovement extends EntityRef {
	/** Balance cost price after the movement (for outbound: the cost that left). */
	costPrice: string
}

export class StockService {
	constructor(private readonly deps: Deps) {}

	/** The only writer of `stock_balances` (ADR-0011 §1). Runs in `db` or its own transaction. */
	recordMovement(input: RecordMovementInput, db?: Db): Promise<RecordedMovement> {
		return record('stock.recordMovement', () =>
			db ? this.#record(input, db) : this.deps.uow.run((tx) => this.#record(input, tx)),
		)
	}

	getBalance(
		materialId: number,
		locationId: number,
		db?: Db,
	): Promise<StockBalanceDto | undefined> {
		return this.deps.repo.findBalance(materialId, locationId, db)
	}

	getBalances(materialIds: number[], locationId: number, db?: Db): Promise<StockBalanceDto[]> {
		return this.deps.repo.findBalances(materialIds, locationId, db)
	}

	async handleGetBalance(query: StockBalanceQueryDto): Promise<StockBalanceDto> {
		const balance = await this.getBalance(query.materialId, query.locationId)
		if (!balance) throw StockError.balanceNotFound(query.materialId, query.locationId)
		return balance
	}

	handleGetBalances(filter: StockBalanceFilterDto): Promise<WithPaginationResult<StockBalanceDto>> {
		return this.deps.repo.findBalancesByLocation(filter)
	}

	handleGetMovements(
		filter: StockMovementFilterDto,
	): Promise<WithPaginationResult<StockMovementDto>> {
		return this.deps.repo.findMovements(filter)
	}

	async #record(input: RecordMovementInput, db: Db): Promise<RecordedMovement> {
		const { materialId, locationId, type, direction, qty } = input
		const { repo, assignment } = this.deps

		// Sales and production consumption are permissive about assignment (ADR-0009/0014).
		if (type !== 'sales' && type !== 'production_out') {
			const assigned = await assignment.isAssigned(materialId, locationId, db)
			if (!assigned) throw StockError.materialNotAssigned(materialId, locationId)
		}

		const current = await repo.findBalance(materialId, locationId, db)
		const oldQty = Qty.of(current?.quantity ?? '0')
		const next = applyMovement(
			{ qty: oldQty, cost: Money.of(current?.costPrice ?? '0') },
			{
				type,
				direction,
				qty: Qty.of(qty),
				unitCost: input.unitCost === undefined ? undefined : Money.of(input.unitCost),
			},
		)
		if (!next) throw StockError.insufficientStock(materialId, locationId, oldQty.toNumeric(), qty)

		const costPrice = next.cost.toCost()
		await repo.upsertBalance(materialId, locationId, next.qty.toNumeric(), costPrice, db)
		const movement = await repo.insertMovement(
			{
				materialId,
				locationId,
				type,
				direction,
				quantity: Qty.of(qty).toNumeric(),
				costPrice,
				referenceType: input.referenceType ?? null,
				referenceId: input.referenceId ?? null,
				notes: input.notes ?? null,
				createdBy: input.actorId,
			},
			db,
		)
		if (!movement) throw StockError.movementFailed()
		return { id: movement.id, costPrice }
	}
}
