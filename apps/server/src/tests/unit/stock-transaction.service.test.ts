import type { DbContext, DbTx } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	AdjustmentTransactionDto,
	ProductionInTransactionDto,
	ProductionOutTransactionDto,
	PurchaseTransactionDto,
	SellTransactionDto,
	StockOpnameDto,
	StockTransactionDto,
	StockTransactionFilterDto,
	StockTransactionSelectDto,
	TransferTransactionDto,
	UsageTransactionDto,
} from '@/modules/inventory/stock-transaction/stock-transaction.contract'
import type { IStockTransactionRepo } from '@/modules/inventory/stock-transaction/stock-transaction.repo'
import { StockTransactionService } from '@/modules/inventory/stock-transaction/stock-transaction.service'

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

class FakeMaterialLocationService {
	private store = new Map<string, { currentQty: string; currentAvgCost: string }>()

	seed(materialId: number, locationId: number, data: { currentQty: string; currentAvgCost: string }) {
		this.store.set(`${materialId}:${locationId}`, data)
	}

	async findOne(materialId: number, locationId: number) {
		const key = `${materialId}:${locationId}`
		const data = this.store.get(key)
		if (!data) return { currentQty: '0', currentAvgCost: '0' }
		return data
	}

	async updateCurrentStock(
		materialId: number,
		locationId: number,
		data: { currentQty: number; currentAvgCost: number; currentValue: number },
		_actorId: number,
		_tx?: DbTx,
	) {
		this.store.set(`${materialId}:${locationId}`, {
			currentQty: data.currentQty.toString(),
			currentAvgCost: data.currentAvgCost.toString(),
		})
	}
}

class FakeStockTransactionRepo implements IStockTransactionRepo {
	readonly db = noConflictDb
	private store = new Map<number, StockTransactionDto>()
	private seq = 0

	seed(rows: StockTransactionDto[]) {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findPage(filter: StockTransactionFilterDto): Promise<WithPaginationResult<StockTransactionSelectDto>> {
		const data = [...this.store.values()] as unknown as StockTransactionSelectDto[]
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

	async findById(id: number): Promise<StockTransactionDto | undefined> {
		return this.store.get(id)
	}

	async findByIds(ids: number[]): Promise<StockTransactionDto[]> {
		return ids.map((id) => this.store.get(id)).filter((x): x is StockTransactionDto => x !== undefined)
	}

	async insert(data: Parameters<IStockTransactionRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		const row = { ...data, id } as unknown as StockTransactionDto
		this.store.set(id, row)
		return { id }
	}

	async insertMany(items: Parameters<IStockTransactionRepo['insertMany']>[0]): Promise<void> {
		for (const item of items) await this.insert(item)
	}

	async softDelete(id: number, _deletedBy: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}

	async hardDelete(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

function makeTransaction(overrides: Partial<StockTransactionDto> = {}): StockTransactionDto {
	return {
		id: 1,
		materialId: 1,
		locationId: 1,
		type: 'purchase',
		date: new Date(),
		referenceNo: 'REF-001',
		notes: null,
		qty: '10',
		unitCost: '100',
		totalCost: '1000',
		counterpartLocationId: null,
		transferId: null,
		runningQty: '10',
		runningAvgCost: '100',
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('StockTransactionService (unit)', () => {
	let repo: FakeStockTransactionRepo
	let mLocation: FakeMaterialLocationService
	let service: StockTransactionService

	beforeEach(() => {
		repo = new FakeStockTransactionRepo()
		mLocation = new FakeMaterialLocationService()
		service = new StockTransactionService(mLocation, repo)
	})

	describe('handleDetail', () => {
		test('returns the transaction when it exists', async () => {
			repo.seed([makeTransaction({ id: 1 })])
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
			expect(result.referenceNo).toBe('REF-001')
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleDetail(999))
		})
	})

	describe('handleList', () => {
		test('returns paginated list', async () => {
			repo.seed([makeTransaction({ id: 1 }), makeTransaction({ id: 2, referenceNo: 'REF-002' })])
			const result = await service.handleList({ page: 1, limit: 10, search: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})

	describe('handleRemove', () => {
		test('soft deletes an existing transaction', async () => {
			repo.seed([makeTransaction({ id: 1 })])
			const result = await service.handleRemove(1, 1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleRemove(999, 1))
		})
	})

	describe('handlePurchase', () => {
		test('creates purchase transactions', async () => {
			mLocation.seed(1, 1, { currentQty: '0', currentAvgCost: '0' })
			const dto: PurchaseTransactionDto = {
				locationId: 1,
				date: new Date(),
				referenceNo: 'PUR-001',
				notes: null,
				items: [{ materialId: 1, qty: '10', unitCost: '100' }],
			}
			const result = await service.handlePurchase(dto, 1)
			expect(result.count).toBe(1)
			expect(result.referenceNo).toBe('PUR-001')
		})
	})

	describe('handleTransfer', () => {
		test('creates transfer transactions when sufficient stock at source', async () => {
			mLocation.seed(1, 1, { currentQty: '100', currentAvgCost: '50' })
			mLocation.seed(1, 2, { currentQty: '0', currentAvgCost: '0' })
			const dto: TransferTransactionDto = {
				sourceLocationId: 1,
				destinationLocationId: 2,
				date: new Date(),
				referenceNo: 'TRF-001',
				notes: null,
				items: [{ materialId: 1, qty: '10' }],
			}
			const result = await service.handleTransfer(dto, 1)
			expect(result.count).toBe(1)
			expect(result.referenceNo).toBe('TRF-001')
		})
	})

	describe('handleAdjustment', () => {
		test('creates adjustment transactions', async () => {
			mLocation.seed(1, 1, { currentQty: '100', currentAvgCost: '50' })
			const dto: AdjustmentTransactionDto = {
				locationId: 1,
				date: new Date(),
				referenceNo: 'ADJ-001',
				notes: null,
				items: [{ materialId: 1, qty: '10', unitCost: '50' }],
			}
			const result = await service.handleAdjustment(dto, 1)
			expect(result.count).toBe(1)
			expect(result.referenceNo).toBe('ADJ-001')
		})
	})

	describe('handleOpname', () => {
		test('creates adjustment when physical count differs', async () => {
			mLocation.seed(1, 1, { currentQty: '100', currentAvgCost: '50' })
			const dto: StockOpnameDto = {
				locationId: 1,
				date: new Date(),
				referenceNo: 'OPN-001',
				notes: null,
				items: [{ materialId: 1, physicalQty: '80', notes: null }],
			}
			const result = await service.handleOpname(dto, 1)
			expect(result.count).toBe(1)
		})
	})

	describe('handleUsage', () => {
		test('creates usage transactions when sufficient stock', async () => {
			mLocation.seed(1, 1, { currentQty: '100', currentAvgCost: '50' })
			const dto: UsageTransactionDto = {
				locationId: 1,
				date: new Date(),
				referenceNo: 'USG-001',
				notes: null,
				items: [{ materialId: 1, qty: '10' }],
			}
			const result = await service.handleUsage(dto, 1)
			expect(result.count).toBe(1)
		})
	})

	describe('handleSell', () => {
		test('creates sell transactions when sufficient stock', async () => {
			mLocation.seed(1, 1, { currentQty: '100', currentAvgCost: '50' })
			const dto: SellTransactionDto = {
				locationId: 1,
				date: new Date(),
				referenceNo: 'SEL-001',
				notes: null,
				items: [{ materialId: 1, qty: '10' }],
			}
			const result = await service.handleSell(dto, 1)
			expect(result.count).toBe(1)
		})
	})

	describe('handleProductionIn', () => {
		test('creates production in transactions', async () => {
			mLocation.seed(1, 1, { currentQty: '0', currentAvgCost: '0' })
			const dto: ProductionInTransactionDto = {
				locationId: 1,
				date: new Date(),
				referenceNo: 'PRD-IN-001',
				notes: null,
				items: [{ materialId: 1, qty: '10', unitCost: '100' }],
			}
			const result = await service.handleProductionIn(dto, 1)
			expect(result.count).toBe(1)
		})
	})

	describe('handleProductionOut', () => {
		test('creates production out transactions when sufficient stock', async () => {
			mLocation.seed(1, 1, { currentQty: '100', currentAvgCost: '50' })
			const dto: ProductionOutTransactionDto = {
				locationId: 1,
				date: new Date(),
				referenceNo: 'PRD-OUT-001',
				notes: null,
				items: [{ materialId: 1, qty: '10' }],
			}
			const result = await service.handleProductionOut(dto, 1)
			expect(result.count).toBe(1)
		})
	})
})
