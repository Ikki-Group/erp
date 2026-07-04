import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	GoodsReceiptNoteCreateDto,
	GoodsReceiptNoteDto,
	GoodsReceiptNoteFilterDto,
	GoodsReceiptNoteSelectDto,
	GoodsReceiptStatus,
} from '@/modules/purchasing/goods-receipt.contract'
import type { IGoodsReceiptRepo } from '@/modules/purchasing/goods-receipt.repo'
import { GoodsReceiptService, type GoodsReceiptDeps } from '@/modules/purchasing/goods-receipt.service'

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

class FakeGoodsReceiptRepo implements IGoodsReceiptRepo {
	readonly db = noConflictDb
	store = new Map<number, GoodsReceiptNoteDto>()
	private seq = 0

	seed(rows: GoodsReceiptNoteDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findById(id: number): Promise<GoodsReceiptNoteDto | undefined> {
		return this.store.get(id)
	}

	async findPage(filter: GoodsReceiptNoteFilterDto): Promise<WithPaginationResult<GoodsReceiptNoteSelectDto>> {
		const data = [...this.store.values()]
		const limit = filter.limit ?? 10
		const items = data.map((r) => {
			const { items: _, ...rest } = r
			return rest as GoodsReceiptNoteSelectDto
		})
		return {
			data: items,
			meta: {
				total: items.length,
				page: filter.page ?? 1,
				limit,
				totalPages: Math.max(1, Math.ceil(items.length / limit)),
			},
		}
	}

	async insert(data: GoodsReceiptNoteCreateDto, actorId: ActorId): Promise<EntityRef | undefined> {
		const id = ++this.seq
		const now = new Date()
		const grn: GoodsReceiptNoteDto = {
			id,
			orderId: data.orderId,
			locationId: data.locationId,
			supplierId: data.supplierId,
			receiveDate: data.receiveDate,
			status: data.status ?? 'open',
			referenceNumber: data.referenceNumber ?? null,
			notes: data.notes ?? null,
			items: data.items.map((item, idx) => ({
				id: idx + 1,
				grnId: id,
				purchaseOrderItemId: item.purchaseOrderItemId,
				materialId: item.materialId,
				itemName: item.itemName,
				quantityReceived: item.quantityReceived,
				notes: item.notes,
				createdBy: actorId,
				updatedBy: actorId,
				createdAt: now,
				updatedAt: now,
			})),
			createdBy: actorId,
			updatedBy: actorId,
			createdAt: now,
			updatedAt: now,
		}
		this.store.set(id, grn)
		return { id }
	}

	async updateStatus(id: number, status: GoodsReceiptStatus, actorId: ActorId): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, status, updatedBy: actorId, updatedAt: new Date() })
		return { id }
	}

	async softDelete(id: number, _actorId: ActorId): Promise<EntityRef | undefined> {
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

class FakeStockTransactionPort {
	async purchase(): Promise<{ count: number; referenceNo: string }> {
		return { count: 1, referenceNo: 'GRN-1' }
	}
}

class FakePurchaseOrderPort {
	async handleGetById(id: number): Promise<{ id: number; status: string }> {
		return { id, status: 'approved' }
	}
}

function makeGoodsReceipt(overrides: Partial<GoodsReceiptNoteDto> = {}): GoodsReceiptNoteDto {
	return {
		id: 1,
		orderId: 1,
		locationId: 1,
		supplierId: 1,
		receiveDate: new Date(),
		status: 'open',
		referenceNumber: null,
		notes: null,
		items: [
			{
				id: 1,
				grnId: 1,
				purchaseOrderItemId: 1,
				materialId: 1,
				itemName: 'Item 1',
				quantityReceived: '10',
				notes: null,
				createdBy: 1,
				updatedBy: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		],
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('GoodsReceiptService (unit)', () => {
	let repo: FakeGoodsReceiptRepo
	let service: GoodsReceiptService
	let stockTxPort: FakeStockTransactionPort
	let poPort: FakePurchaseOrderPort

	beforeEach(() => {
		repo = new FakeGoodsReceiptRepo()
		stockTxPort = new FakeStockTransactionPort()
		poPort = new FakePurchaseOrderPort()
		const deps: GoodsReceiptDeps = {
			stockTransaction: stockTxPort,
			purchaseOrder: poPort,
		}
		service = new GoodsReceiptService(deps, repo, createMockCacheClient() as never)
	})

	describe('handleDetail', () => {
		test('returns the goods receipt when it exists', async () => {
			repo.seed([makeGoodsReceipt({ id: 1 })])
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleDetail(999))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeGoodsReceipt({ id: 1 }), makeGoodsReceipt({ id: 2 })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})

	describe('handleCreate', () => {
		test('creates and returns a ref', async () => {
			const dto: GoodsReceiptNoteCreateDto = {
				orderId: 1,
				locationId: 1,
				supplierId: 1,
				receiveDate: new Date(),
				status: 'open',
				referenceNumber: null,
				notes: null,
				items: [
					{
						id: 1,
						grnId: 0,
						purchaseOrderItemId: 1,
						materialId: 1,
						itemName: 'Item 1',
						quantityReceived: '10',
						notes: null,
						createdBy: 1,
						updatedBy: 1,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				],
			}
			const result = await service.handleCreate(dto, 1)
			expect(result.id).toBeDefined()
		})
	})

	describe('handleRemove', () => {
		test('removes an existing goods receipt', async () => {
			repo.seed([makeGoodsReceipt({ id: 1 })])
			const result = await service.handleRemove(1, 1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing goods receipt', async () => {
			await expectReject(service.handleRemove(999, 1))
		})
	})
})
