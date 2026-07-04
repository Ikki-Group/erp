/**
 * Unit tests for WorkOrderService.
 *
 * These run WITHOUT a database. The service depends on the `IWorkOrderRepo`
 * port, so we pass a typed in-memory fake (no `as any`). The only infra seam
 * that still touches a `db` is `checkConflict`, so the fake repo exposes a
 * tiny `db` stub whose `select(...).from(...).where(...).limit(...)` resolves
 * to "no conflict".
 */

import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { WorkOrderDto, WorkOrderFilterDto } from '@/modules/production/work-order.contract'
import type { IWorkOrderRepo } from '@/modules/production/work-order.repo'
import {
	type RecipeReadPort,
	type RecipeReadResult,
	type StockTransactionPort,
	WorkOrderService,
} from '@/modules/production/work-order.service'

import { createMockCacheClient } from '../helpers/mock-db'
import { beforeEach, describe, expect, test } from 'bun:test'

async function expectReject(promise: Promise<unknown>): Promise<void> {
	let threw = false
	try {
		await promise
	} catch {
		threw = true
	}
	expect(threw).toBe(true)
}

const noConflictDb = {
	select: () => ({
		from: () => ({
			where: () => ({
				limit: async () => [] as { id: number }[],
			}),
		}),
	}),
} as unknown as DbContext

class FakeWorkOrderRepo implements IWorkOrderRepo {
	readonly db = noConflictDb
	store = new Map<number, WorkOrderDto>()
	private seq = 0

	seed(rows: WorkOrderDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findById(id: number): Promise<WorkOrderDto | undefined> {
		return this.store.get(id)
	}

	async findPage(filter: WorkOrderFilterDto): Promise<WithPaginationResult<WorkOrderDto>> {
		const data = [...this.store.values()]
		const limit = filter.limit ?? 10
		return {
			data,
			meta: {
				total: data.length,
				page: filter.page ?? 1,
				limit,
				totalPages: Math.max(1, Math.ceil(data.length / limit)),
			},
		}
	}

	async insert(
		data: Parameters<IWorkOrderRepo['insert']>[0],
		actorId: number,
	): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, {
			...(data as unknown as WorkOrderDto),
			id,
			status: 'draft',
			actualQty: '0',
			totalCost: '0',
			createdBy: actorId,
			updatedBy: actorId,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		return { id }
	}

	async update(
		id: number,
		data: Parameters<IWorkOrderRepo['update']>[1],
		actorId: number,
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, {
			...existing,
			...(data as Partial<WorkOrderDto>),
			updatedBy: actorId,
			updatedAt: new Date(),
		})
		return { id }
	}
}

function makeWorkOrder(overrides: Partial<WorkOrderDto> = {}): WorkOrderDto {
	return {
		id: 1,
		recipeId: 1,
		locationId: 1,
		status: 'draft',
		expectedQty: '100',
		actualQty: '0',
		note: null,
		totalCost: '0',
		startedAt: null,
		completedAt: null,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

function makeRecipeResult(): RecipeReadResult {
	return {
		id: 1,
		materialId: 10,
		targetQty: '50',
		items: [{ materialId: 20, qty: '10', scrapPercentage: '0' }],
	}
}

class MockRecipePort implements RecipeReadPort {
	private result: RecipeReadResult | undefined = makeRecipeResult()

	setResult(result: RecipeReadResult | undefined) {
		this.result = result
	}

	async getById(_id: number): Promise<RecipeReadResult | undefined> {
		return this.result
	}

	async handleCalculateCost(_recipeId: number): Promise<{ totalCost: string }> {
		return { totalCost: '1000' }
	}
}

class MockStockPort implements StockTransactionPort {
	async productionIn(): Promise<{ count: number; referenceNo: string }> {
		return { count: 1, referenceNo: 'WO-IN-1' }
	}

	async productionOut(): Promise<{ count: number; referenceNo: string }> {
		return { count: 1, referenceNo: 'WO-OUT-1' }
	}
}

describe('WorkOrderService (unit)', () => {
	let repo: FakeWorkOrderRepo
	let service: WorkOrderService
	let recipePort: MockRecipePort
	let stockPort: MockStockPort

	beforeEach(() => {
		repo = new FakeWorkOrderRepo()
		recipePort = new MockRecipePort()
		stockPort = new MockStockPort()
		service = new WorkOrderService(
			{ recipe: recipePort, stockTransaction: stockPort },
			repo,
			createMockCacheClient() as never,
		)
	})

	describe('handleDetail', () => {
		test('returns the work order when it exists', async () => {
			repo.seed([makeWorkOrder({ id: 1 })])
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleDetail(999))
		})
	})

	describe('handleCreate', () => {
		test('creates and returns a ref', async () => {
			const actor = 7
			const result = await service.handleCreate(
				{
					recipeId: 1,
					locationId: 1,
					expectedQty: '100',
					note: null,
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.recipeId).toBe(1)
			expect(stored?.createdBy).toBe(actor)
		})
	})

	describe('handleStart', () => {
		test('starts a draft work order', async () => {
			repo.seed([makeWorkOrder({ id: 1, status: 'draft' })])
			const result = await service.handleStart(1, 9)
			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.status).toBe('in_progress')
			expect(stored?.startedAt).toBeDefined()
		})

		test('throws when work order not found', async () => {
			await expectReject(service.handleStart(999, 1))
		})

		test('throws when status is not draft', async () => {
			repo.seed([makeWorkOrder({ id: 1, status: 'in_progress' })])
			await expectReject(service.handleStart(1, 1))
		})
	})

	describe('handleComplete', () => {
		test('completes an in_progress work order', async () => {
			repo.seed([makeWorkOrder({ id: 1, status: 'in_progress' })])
			const result = await service.handleComplete(
				1,
				{ id: 1, actualQty: '50', note: null },
				9,
			)
			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.status).toBe('completed')
			expect(stored?.actualQty).toBe('50')
			expect(stored?.completedAt).toBeDefined()
		})

		test('throws when work order not found', async () => {
			await expectReject(
				service.handleComplete(999, { id: 999, actualQty: '50', note: null }, 1),
			)
		})

		test('throws when status is not in_progress', async () => {
			repo.seed([makeWorkOrder({ id: 1, status: 'draft' })])
			await expectReject(service.handleComplete(1, { id: 1, actualQty: '50', note: null }, 1))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeWorkOrder({ id: 1 }), makeWorkOrder({ id: 2 })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})
})
