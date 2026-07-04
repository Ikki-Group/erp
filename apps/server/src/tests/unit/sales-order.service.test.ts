import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	SalesOrderDto,
	SalesOrderFilterDto,
	SalesOrderOutputDto,
} from '@/modules/sales/sales-order/sales-order.contract'
import type { ISalesOrderRepo } from '@/modules/sales/sales-order/sales-order.repo'
import {
	SalesOrderService,
	type CustomerReadPort,
	type LocationReadPort,
	type ProductReadPort,
	type SalesTypeReadPort,
} from '@/modules/sales/sales-order/sales-order.service'

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

class FakeSalesOrderRepo implements ISalesOrderRepo {
	readonly db = noConflictDb
	private orders = new Map<number, SalesOrderOutputDto>()
	private seq = 0

	seed(orders: SalesOrderOutputDto[]): void {
		for (const o of orders) {
			this.orders.set(o.id, o)
			this.seq = Math.max(this.seq, o.id)
		}
	}

	async findById(id: number): Promise<SalesOrderOutputDto | undefined> {
		return this.orders.get(id)
	}

	async findPage(filter: SalesOrderFilterDto): Promise<WithPaginationResult<SalesOrderDto>> {
		const data = [...this.orders.values()]
		const limit = filter.limit ?? 10
		return {
			data: data as unknown as SalesOrderDto[],
			meta: {
				total: data.length,
				page: filter.page ?? 1,
				limit,
				totalPages: Math.max(1, Math.ceil(data.length / limit)),
			},
		}
	}

	async findExternalRef(): Promise<number | undefined> {
		return undefined
	}

	async insert(_data: Parameters<ISalesOrderRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		return { id }
	}

	async insertItems(): Promise<void> {}

	async insertBatch(_data: Parameters<ISalesOrderRepo['insertBatch']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		return { id }
	}

	async insertVoid(): Promise<EntityRef | undefined> {
		return { id: ++this.seq }
	}

	async insertExternalRef(): Promise<void> {}

	async updateOrder(): Promise<EntityRef | undefined> {
		return undefined
	}

	async updateOrderStatus(id: number): Promise<EntityRef | undefined> {
		return { id }
	}

	async recalculateTotals(): Promise<void> {}
}

function makeOrder(overrides: Partial<SalesOrderOutputDto> = {}): SalesOrderOutputDto {
	return {
		id: 1,
		locationId: 1,
		customerId: null,
		salesTypeId: 1,
		status: 'open',
		transactionDate: new Date(),
		totalAmount: '0',
		discountAmount: '0',
		taxAmount: '0',
		gratuityAmount: '0',
		refundAmount: '0',
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		items: [],
		batches: [],
		voids: [],
		...overrides,
	}
}

class FakeLocationReadPort implements LocationReadPort {
	async getById(id: number) {
		return { id, name: `Location ${id}` }
	}
}

class FakeCustomerReadPort implements CustomerReadPort {
	async getById(id: number) {
		return { id, name: `Customer ${id}` }
	}
}

class FakeSalesTypeReadPort implements SalesTypeReadPort {
	async getById(id: number) {
		return { id, name: `SalesType ${id}` }
	}
}

class FakeProductReadPort implements ProductReadPort {
	async getById(id: number) {
		return { id, name: `Product ${id}` }
	}
}

describe('SalesOrderService (unit)', () => {
	let repo: FakeSalesOrderRepo
	let service: SalesOrderService
	let deps: {
		location: LocationReadPort
		customer: CustomerReadPort
		salesType: SalesTypeReadPort
		product: ProductReadPort
	}

	beforeEach(() => {
		repo = new FakeSalesOrderRepo()
		deps = {
			location: new FakeLocationReadPort(),
			customer: new FakeCustomerReadPort(),
			salesType: new FakeSalesTypeReadPort(),
			product: new FakeProductReadPort(),
		}
		service = new SalesOrderService(repo, createMockCacheClient() as never, deps)
	})

	describe('handleDetail', () => {
		test('returns the order when it exists', async () => {
			repo.seed([makeOrder({ id: 1 })])
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleDetail(999))
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
		test('creates and returns a ref', async () => {
			const result = await service.handleCreate(
				{
					locationId: 1,
					salesTypeId: 1,
					status: 'open',
					transactionDate: new Date(),
					totalAmount: '100',
					discountAmount: '0',
					taxAmount: '0',
					gratuityAmount: '0',
					refundAmount: '0',
				},
				7,
			)
			expect(result.id).toBeDefined()
		})
	})

	describe('handleClose', () => {
		test('closes an open order', async () => {
			repo.seed([makeOrder({ id: 1, status: 'open' })])
			const result = await service.handleClose(1, 7)
			expect(result.id).toBe(1)
		})

		test('throws NotFound when order missing', async () => {
			await expectReject(service.handleClose(999, 7))
		})

		test('throws notOpen when order already closed', async () => {
			repo.seed([makeOrder({ id: 1, status: 'closed' })])
			await expectReject(service.handleClose(1, 7))
		})
	})
})
