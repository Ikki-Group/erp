import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	PaymentDto,
	PaymentFilterDto,
	PaymentInvoiceDto,
	PaymentUpdateDto,
} from '@/modules/payment/payment/payment.contract'
import type { IPaymentRepo } from '@/modules/payment/payment/payment.repo'
import { PaymentService } from '@/modules/payment/payment/payment.service'

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

class FakePaymentRepo implements IPaymentRepo {
	readonly db = noConflictDb
	store = new Map<number, PaymentDto>()
	invoiceStore = new Map<number, PaymentInvoiceDto>()
	private seq = 0

	seed(rows: PaymentDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findMany(_filter?: PaymentFilterDto): Promise<PaymentDto[]> {
		return [...this.store.values()]
	}

	async findPage(filter: PaymentFilterDto): Promise<WithPaginationResult<PaymentDto>> {
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

	async findById(id: number): Promise<PaymentDto | undefined> {
		return this.store.get(id)
	}

	async count(): Promise<number> {
		return this.store.size
	}

	async findPaymentInvoicesByPaymentId(paymentId: number): Promise<PaymentInvoiceDto[]> {
		return [...this.invoiceStore.values()].filter((i) => i.paymentId === paymentId)
	}

	async insert(data: Parameters<IPaymentRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, { ...(data as unknown as PaymentDto), id })
		return { id }
	}

	async update(
		id: number,
		data: Parameters<IPaymentRepo['update']>[1],
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as Partial<PaymentDto>), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

function makePayment(overrides: Partial<PaymentDto> = {}): PaymentDto {
	return {
		id: 1,
		type: 'receivable',
		date: new Date(),
		referenceNo: 'PAY-001',
		accountId: 1,
		method: 'cash',
		amount: '100.00',
		notes: null,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('PaymentService (unit)', () => {
	let repo: FakePaymentRepo
	let service: PaymentService

	beforeEach(() => {
		repo = new FakePaymentRepo()
		service = new PaymentService(repo, createMockCacheClient() as never)
	})

	describe('handleDetail', () => {
		test('returns the payment when it exists', async () => {
			repo.seed([makePayment({ id: 1 })])
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
			expect(result.referenceNo).toBe('PAY-001')
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
					type: 'receivable',
					date: new Date(),
					referenceNo: 'PAY-NEW',
					accountId: 1,
					method: 'cash',
					amount: '150.00',
					notes: null,
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.referenceNo).toBe('PAY-NEW')
			expect(stored?.createdBy).toBe(actor)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing payment and stamps updatedBy', async () => {
			repo.seed([makePayment({ id: 1, amount: '100.00' })])

			const dto: PaymentUpdateDto = {
				id: 1,
				type: 'receivable',
				date: new Date(),
				referenceNo: 'PAY-001',
				accountId: 1,
				method: 'bank_transfer',
				amount: '200.00',
				notes: 'Updated',
			}
			const result = await service.handleUpdate(dto, 9)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.method).toBe('bank_transfer')
			expect(stored?.amount).toBe('200.00')
			expect(stored?.updatedBy).toBe(9)
		})

		test('throws NotFound when updating a missing payment', async () => {
			const dto: PaymentUpdateDto = {
				id: 404,
				type: 'receivable',
				date: new Date(),
				referenceNo: 'X',
				accountId: 1,
				method: 'cash',
				amount: '0',
				notes: null,
			}
			await expectReject(service.handleUpdate(dto, 1))
		})
	})

	describe('handleRemove', () => {
		test('removes an existing payment', async () => {
			repo.seed([makePayment({ id: 1 })])
			const result = await service.handleRemove(1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing payment', async () => {
			await expectReject(service.handleRemove(999))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makePayment({ id: 1 }), makePayment({ id: 2, referenceNo: 'PAY-002' })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})
})
