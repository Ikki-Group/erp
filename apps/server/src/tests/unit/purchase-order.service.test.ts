import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	PurchaseOrderDto,
	PurchaseOrderFilterDto,
	PurchaseOrderSelectDto,
	PurchaseOrderStatus,
} from '@/modules/purchasing/purchase-order.contract'
import type { IPurchaseOrderRepo } from '@/modules/purchasing/purchase-order.repo'
import type { PurchaseOrderDeps } from '@/modules/purchasing/purchase-order.service'
import { PurchaseOrderService } from '@/modules/purchasing/purchase-order.service'

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

class FakePurchaseOrderRepo implements IPurchaseOrderRepo {
	readonly db = noConflictDb
	store = new Map<number, PurchaseOrderDto>()
	private seq = 0

	seed(rows: PurchaseOrderDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findById(id: number): Promise<PurchaseOrderDto | undefined> {
		return this.store.get(id)
	}

	async findPage(filter: PurchaseOrderFilterDto): Promise<WithPaginationResult<PurchaseOrderSelectDto>> {
		const data = [...this.store.values()].map(({ items: _, ...rest }) => rest)
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
		_data: Parameters<IPurchaseOrderRepo['insert']>[0],
		_items: Parameters<IPurchaseOrderRepo['insert']>[1],
	): Promise<EntityRef | undefined> {
		const id = ++this.seq
		return { id }
	}

	async update(
		id: number,
		_data: Parameters<IPurchaseOrderRepo['update']>[1],
		_items: Parameters<IPurchaseOrderRepo['update']>[2],
	): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		return { id }
	}

	async updateStatus(id: number, status: PurchaseOrderStatus): Promise<EntityRef | undefined> {
		const order = this.store.get(id)
		if (!order) return undefined
		this.store.set(id, { ...order, status })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

class FakeDeps implements PurchaseOrderDeps {
	private suppliers = new Map<number, { id: number; name: string }>()
	private locations = new Map<number, { id: number; name: string }>()
	private materials = new Map<number, { id: number; name: string }>()

	seedSupplier(id: number, name: string) {
		this.suppliers.set(id, { id, name })
	}

	seedLocation(id: number, name: string) {
		this.locations.set(id, { id, name })
	}

	seedMaterial(id: number, name: string) {
		this.materials.set(id, { id, name })
	}

	supplier = {
		getById: async (id: number) => this.suppliers.get(id),
	}

	location = {
		getById: async (id: number) => this.locations.get(id),
	}

	material = {
		getById: async (id: number) => this.materials.get(id),
	}
}

function makeOrder(overrides: Partial<PurchaseOrderDto> = {}): PurchaseOrderDto {
	return {
		id: 1,
		locationId: 1,
		supplierId: 1,
		status: 'open',
		transactionDate: new Date(),
		expectedDeliveryDate: null,
		totalAmount: '0',
		discountAmount: '0',
		taxAmount: '0',
		notes: null,
		items: [],
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('PurchaseOrderService (unit)', () => {
	let repo: FakePurchaseOrderRepo
	let deps: FakeDeps
	let service: PurchaseOrderService

	beforeEach(() => {
		repo = new FakePurchaseOrderRepo()
		deps = new FakeDeps()
		service = new PurchaseOrderService(deps, repo, createMockCacheClient() as never)
	})

	describe('handleGetById', () => {
		test('returns the order when it exists', async () => {
			repo.seed([makeOrder({ id: 1 })])
			const result = await service.handleGetById(1)
			expect(result.id).toBe(1)
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleGetById(999))
		})
	})

	describe('handleList', () => {
		test('returns paginated list', async () => {
			repo.seed([makeOrder({ id: 1 }), makeOrder({ id: 2 })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})

	describe('handleCreate', () => {
		test('creates order with valid refs', async () => {
			deps.seedSupplier(1, 'Supplier A')
			deps.seedLocation(1, 'Location A')

			const result = await service.handleCreate(
				{
					locationId: 1,
					supplierId: 1,
					status: 'open',
					transactionDate: new Date(),
					totalAmount: '100',
					discountAmount: '0',
					taxAmount: '0',
					notes: null,
					items: [
						{
							itemName: 'Item 1',
							quantity: '1',
							unitPrice: '100',
							discountAmount: '0',
							taxAmount: '0',
							subtotal: '100',
						},
					],
				},
				1 as ActorId,
			)
			expect(result.id).toBeDefined()
		})

		test('throws NotFound for missing supplier', async () => {
			deps.seedLocation(1, 'Location A')
			await expectReject(
				service.handleCreate(
					{
						locationId: 1,
						supplierId: 999,
						status: 'open',
						transactionDate: new Date(),
						totalAmount: '100',
						discountAmount: '0',
						taxAmount: '0',
						notes: null,
						items: [{ itemName: 'X', quantity: '1', unitPrice: '100', discountAmount: '0', taxAmount: '0', subtotal: '100' }],
					},
					1 as ActorId,
				),
			)
		})

		test('throws NotFound for missing location', async () => {
			deps.seedSupplier(1, 'Supplier A')
			await expectReject(
				service.handleCreate(
					{
						locationId: 999,
						supplierId: 1,
						status: 'open',
						transactionDate: new Date(),
						totalAmount: '100',
						discountAmount: '0',
						taxAmount: '0',
						notes: null,
						items: [{ itemName: 'X', quantity: '1', unitPrice: '100', discountAmount: '0', taxAmount: '0', subtotal: '100' }],
					},
					1 as ActorId,
				),
			)
		})

		test('throws NotFound for missing material', async () => {
			deps.seedSupplier(1, 'Supplier A')
			deps.seedLocation(1, 'Location A')
			await expectReject(
				service.handleCreate(
					{
						locationId: 1,
						supplierId: 1,
						status: 'open',
						transactionDate: new Date(),
						totalAmount: '100',
						discountAmount: '0',
						taxAmount: '0',
						notes: null,
						items: [{ materialId: 999, itemName: 'X', quantity: '1', unitPrice: '100', discountAmount: '0', taxAmount: '0', subtotal: '100' }],
					},
					1 as ActorId,
				),
			)
		})
	})

	describe('handleSubmitForApproval', () => {
		test('transitions open to pending_approval', async () => {
			repo.seed([makeOrder({ id: 1, status: 'open' })])
			const result = await service.handleSubmitForApproval({ id: 1 })
			expect(result.id).toBe(1)
		})

		test('throws for non-open status', async () => {
			repo.seed([makeOrder({ id: 1, status: 'approved' })])
			await expectReject(service.handleSubmitForApproval({ id: 1 }))
		})
	})

	describe('handleApprove', () => {
		test('transitions pending_approval to approved', async () => {
			repo.seed([makeOrder({ id: 1, status: 'pending_approval' })])
			const result = await service.handleApprove({ id: 1 })
			expect(result.id).toBe(1)
		})

		test('throws for non-pending_approval status', async () => {
			repo.seed([makeOrder({ id: 1, status: 'open' })])
			await expectReject(service.handleApprove({ id: 1 }))
		})
	})

	describe('handleReject', () => {
		test('transitions pending_approval to rejected', async () => {
			repo.seed([makeOrder({ id: 1, status: 'pending_approval' })])
			const result = await service.handleReject({ id: 1, reason: 'Not good' })
			expect(result.id).toBe(1)
		})

		test('throws for non-pending_approval status', async () => {
			repo.seed([makeOrder({ id: 1, status: 'open' })])
			await expectReject(service.handleReject({ id: 1, reason: 'Not good' }))
		})
	})

	describe('handleRemove', () => {
		test('removes existing order', async () => {
			repo.seed([makeOrder({ id: 1 })])
			const result = await service.handleRemove(1)
			expect(result.id).toBe(1)
		})

		test('throws NotFound for missing order', async () => {
			await expectReject(service.handleRemove(999))
		})
	})
})
