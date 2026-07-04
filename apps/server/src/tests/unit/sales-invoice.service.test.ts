/**
 * Unit tests for SalesInvoiceService.
 *
 * These run WITHOUT a database. The service depends on the `ISalesInvoiceRepo`
 * port, so we pass a typed in-memory fake (no `as any`). The only infra seam
 * that still touches a `db` is `checkConflict`, so the fake repo exposes a
 * tiny `db` stub whose `select(...).from(...).where(...).limit(...)` resolves
 * to "no conflict".
 */

import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	SalesInvoiceDto,
	SalesInvoiceFilterDto,
	SalesInvoiceItemDto,
	SalesInvoiceWithItemsDto,
} from '@/modules/sales/sales-invoice/sales-invoice.contract'
import type { ISalesInvoiceRepo } from '@/modules/sales/sales-invoice/sales-invoice.repo'
import {
	SalesInvoiceService,
	type ISalesOrderPort,
} from '@/modules/sales/sales-invoice/sales-invoice.service'

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

class FakeSalesInvoiceRepo implements ISalesInvoiceRepo {
	readonly db = noConflictDb
	store = new Map<number, SalesInvoiceDto>()
	itemStore = new Map<number, SalesInvoiceItemDto>()
	private seq = 0
	private itemSeq = 0

	seed(rows: SalesInvoiceDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	seedItems(rows: SalesInvoiceItemDto[]): void {
		for (const r of rows) {
			this.itemStore.set(r.id, r)
			this.itemSeq = Math.max(this.itemSeq, r.id)
		}
	}

	async findPage(filter: SalesInvoiceFilterDto): Promise<WithPaginationResult<SalesInvoiceDto>> {
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

	async findById(id: number): Promise<SalesInvoiceDto | undefined> {
		return this.store.get(id)
	}

	async findByIds(ids: number[]): Promise<SalesInvoiceDto[]> {
		return ids.map((id) => this.store.get(id)).filter((x): x is SalesInvoiceDto => x !== undefined)
	}

	async findWithItems(id: number): Promise<SalesInvoiceWithItemsDto | undefined> {
		const invoice = this.store.get(id)
		if (!invoice) return undefined
		const items = [...this.itemStore.values()].filter((i) => i.invoiceId === id)
		return { invoice, items }
	}

	async findByOrderId(orderId: number): Promise<SalesInvoiceDto | undefined> {
		return [...this.store.values()].find((inv) => inv.orderId === orderId)
	}

	async insert(data: Parameters<ISalesInvoiceRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		const invoice = {
			...(data as unknown as SalesInvoiceDto),
			id,
			status: data.status ?? 'draft',
		}
		this.store.set(id, invoice)
		return { id }
	}

	async insertItems(
		items: Parameters<ISalesInvoiceRepo['insertItems']>[0],
	): Promise<void> {
		for (const item of items) {
			const id = ++this.itemSeq
			this.itemStore.set(id, {
				...(item as unknown as SalesInvoiceItemDto),
				id,
			})
		}
	}

	async update(id: number, data: Parameters<ISalesInvoiceRepo['update']>[1]): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as Partial<SalesInvoiceDto>), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

class FakeSalesOrderPort implements ISalesOrderPort {
	private orders = new Map<number, { id: number; status: string }>()
	private items = new Map<number, Array<{
		id: number
		productId: number | null
		variantId: number | null
		itemName: string
		quantity: string
		unitPrice: string
		taxAmount: string
		discountAmount: string
		subtotal: string
	}>>()

	seedOrder(order: { id: number; status: string }): void {
		this.orders.set(order.id, order)
	}

	seedOrderItems(orderId: number, items: Array<{
		id: number
		productId: number | null
		variantId: number | null
		itemName: string
		quantity: string
		unitPrice: string
		taxAmount: string
		discountAmount: string
		subtotal: string
	}>): void {
		this.items.set(orderId, items)
	}

	async findById(orderId: number): Promise<{ id: number; status: string } | undefined> {
		return this.orders.get(orderId)
	}

	async findItemsByOrderId(orderId: number, _db: DbContext): Promise<Array<{
		id: number
		productId: number | null
		variantId: number | null
		itemName: string
		quantity: string
		unitPrice: string
		taxAmount: string
		discountAmount: string
		subtotal: string
	}>> {
		return this.items.get(orderId) ?? []
	}
}

function makeInvoice(overrides: Partial<SalesInvoiceDto> = {}): SalesInvoiceDto {
	return {
		id: 1,
		orderId: 1,
		customerId: null,
		locationId: 1,
		status: 'draft',
		invoiceDate: new Date(),
		dueDate: null,
		totalAmount: '0',
		taxAmount: '0',
		discountAmount: '0',
		notes: null,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('SalesInvoiceService (unit)', () => {
	let repo: FakeSalesInvoiceRepo
	let salesOrder: FakeSalesOrderPort
	let service: SalesInvoiceService

	beforeEach(() => {
		repo = new FakeSalesInvoiceRepo()
		salesOrder = new FakeSalesOrderPort()
		service = new SalesInvoiceService(repo, salesOrder, createMockCacheClient() as never)
	})

	describe('handleDetail', () => {
		test('returns the invoice when it exists', async () => {
			repo.seed([makeInvoice({ id: 1 })])
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleDetail(999))
		})
	})

	describe('handleCreate', () => {
		test('creates and returns a ref, applying the audit stamp', async () => {
			const actor = 7
			const result = await service.handleCreate(
				{
					orderId: 1,
					locationId: 1,
					customerId: undefined,
					dueDate: undefined,
					notes: undefined,
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.orderId).toBe(1)
			expect(stored?.createdBy).toBe(actor)
		})
	})

	describe('handleGenerateFromOrder', () => {
		test('generates invoice from order with items', async () => {
			salesOrder.seedOrder({ id: 1, status: 'open' })
			salesOrder.seedOrderItems(1, [
				{
					id: 1,
					productId: 1,
					variantId: null,
					itemName: 'Product 1',
					quantity: '2',
					unitPrice: '100',
					taxAmount: '10',
					discountAmount: '5',
					subtotal: '205',
				},
			])

			const result = await service.handleGenerateFromOrder(
				{
					orderId: 1,
					locationId: 1,
					customerId: undefined,
					dueDate: undefined,
					notes: undefined,
				},
				9,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findWithItems(result.id)
			expect(stored?.invoice.orderId).toBe(1)
			expect(stored?.items.length).toBe(1)
			expect(stored?.items[0]?.itemName).toBe('Product 1')
		})

		test('throws when order not found', async () => {
			await expectReject(
				service.handleGenerateFromOrder(
					{
						orderId: 999,
						locationId: 1,
						customerId: undefined,
						dueDate: undefined,
						notes: undefined,
					},
					1,
				),
			)
		})

		test('throws when invoice already exists for order', async () => {
			repo.seed([makeInvoice({ id: 1, orderId: 1 })])
			salesOrder.seedOrder({ id: 1, status: 'open' })

			await expectReject(
				service.handleGenerateFromOrder(
					{
						orderId: 1,
						locationId: 1,
						customerId: undefined,
						dueDate: undefined,
						notes: undefined,
					},
					1,
				),
			)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing invoice and stamps updatedBy', async () => {
			repo.seed([makeInvoice({ id: 1, notes: 'Old notes' })])

			const result = await service.handleUpdate(
				{
					id: 1,
					status: 'open',
					dueDate: undefined,
					notes: 'Updated notes',
				},
				9,
			)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.notes).toBe('Updated notes')
			expect(stored?.updatedBy).toBe(9)
		})

		test('throws NotFound when updating a missing invoice', async () => {
			await expectReject(
				service.handleUpdate(
					{
						id: 404,
						status: 'open',
						dueDate: undefined,
						notes: undefined,
					},
					1,
				),
			)
		})

		test('throws when updating paid invoice', async () => {
			repo.seed([makeInvoice({ id: 1, status: 'paid' })])

			await expectReject(
				service.handleUpdate(
					{
						id: 1,
						status: 'draft',
						dueDate: undefined,
						notes: undefined,
					},
					1,
				),
			)
		})
	})

	describe('handleRemove', () => {
		test('removes an existing draft invoice', async () => {
			repo.seed([makeInvoice({ id: 1, status: 'draft' })])
			const result = await service.handleRemove(1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws when deleting an open invoice', async () => {
			repo.seed([makeInvoice({ id: 1, status: 'open' })])

			await expectReject(service.handleRemove(1))
		})

		test('throws NotFound when deleting a missing invoice', async () => {
			await expectReject(service.handleRemove(999))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeInvoice({ id: 1 }), makeInvoice({ id: 2, orderId: 2 })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})
})
