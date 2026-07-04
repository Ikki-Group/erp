import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodUpdateDto,
} from '@/modules/payment/payment-method/payment-method.contract'
import type { IPaymentMethodRepo, PaymentMethodInsert } from '@/modules/payment/payment-method/payment-method.repo'
import { PaymentMethodService } from '@/modules/payment/payment-method/payment-method.service'

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

class FakePaymentMethodRepo implements IPaymentMethodRepo {
	readonly db = noConflictDb
	store = new Map<number, PaymentMethodDto>()
	private seq = 0

	seedTestData(rows: PaymentMethodDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findMany(_filter?: Partial<Pick<PaymentMethodFilterDto, 'q' | 'category' | 'isEnabled' | 'isGlobal'>>): Promise<PaymentMethodDto[]> {
		return [...this.store.values()]
	}

	async findPage(filter: PaymentMethodFilterDto): Promise<WithPaginationResult<PaymentMethodDto>> {
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

	async findById(id: number): Promise<PaymentMethodDto | undefined> {
		return this.store.get(id)
	}

	async findEnabled(): Promise<PaymentMethodDto[]> {
		return [...this.store.values()].filter((x) => x.isEnabled)
	}

	async findGlobal(): Promise<PaymentMethodDto[]> {
		return [...this.store.values()].filter((x) => x.isGlobal && x.isEnabled)
	}

	async count(): Promise<number> {
		return this.store.size
	}

	async insert(data: Parameters<IPaymentMethodRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, { ...(data as unknown as PaymentMethodDto), id })
		return { id }
	}

	async update(id: number, data: Parameters<IPaymentMethodRepo['update']>[1]): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as Partial<PaymentMethodDto>), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}

	async insertMany(items: Parameters<IPaymentMethodRepo['insertMany']>[0]): Promise<void> {
		for (const item of items) await this.insert(item)
	}

	async seed(data: (PaymentMethodInsert & { createdBy: number })[], _db?: DbContext): Promise<void> {
		for (const d of data) {
			const id = ++this.seq
			this.store.set(id, {
				...d,
				id,
				createdAt: d.createdAt ?? new Date(),
				updatedAt: d.updatedAt ?? new Date(),
				updatedBy: d.updatedBy ?? d.createdBy,
			} as PaymentMethodDto)
		}
	}
}

function makePaymentMethod(overrides: Partial<PaymentMethodDto> = {}): PaymentMethodDto {
	return {
		id: 1,
		type: 'cash',
		category: 'cash',
		name: 'Tunai',
		isEnabled: true,
		isDefault: true,
		isGlobal: true,
		paymentProviderId: null,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('PaymentMethodService (unit)', () => {
	let repo: FakePaymentMethodRepo
	let service: PaymentMethodService

	beforeEach(() => {
		repo = new FakePaymentMethodRepo()
		service = new PaymentMethodService(repo, createMockCacheClient() as never)
	})

	describe('handleGetById', () => {
		test('returns the payment method when it exists', async () => {
			repo.seedTestData([makePaymentMethod({ id: 1 })])
			const result = await service.handleGetById(1)
			expect(result.id).toBe(1)
			expect(result.name).toBe('Tunai')
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleGetById(999))
		})
	})

	describe('handleCreate', () => {
		test('creates and returns a ref, applying the audit stamp', async () => {
			const actor = 7
			const result = await service.handleCreate(
				{
					type: 'e_wallet',
					category: 'cashless',
					name: 'QRIS BCA',
					isEnabled: true,
					isDefault: false,
					isGlobal: true,
					paymentProviderId: null,
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.name).toBe('QRIS BCA')
			expect(stored?.createdBy).toBe(actor)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing payment method and stamps updatedBy', async () => {
			repo.seedTestData([makePaymentMethod({ id: 1, name: 'Old' })])

			const dto: PaymentMethodUpdateDto = {
				id: 1,
				type: 'cash',
				category: 'cash',
				name: 'Updated',
				isEnabled: true,
				isDefault: true,
				isGlobal: false,
				paymentProviderId: null,
			}
			const result = await service.handleUpdate(dto, 9)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.name).toBe('Updated')
			expect(stored?.updatedBy).toBe(9)
		})

		test('throws NotFound when updating a missing payment method', async () => {
			const dto: PaymentMethodUpdateDto = {
				id: 404,
				type: 'cash',
				category: 'cash',
				name: 'X',
				isEnabled: true,
				isDefault: false,
				isGlobal: false,
				paymentProviderId: null,
			}
			await expectReject(service.handleUpdate(dto, 1))
		})
	})

	describe('handleDelete', () => {
		test('removes an existing payment method', async () => {
			repo.seedTestData([makePaymentMethod({ id: 1 })])
			const result = await service.handleDelete(1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing payment method', async () => {
			await expectReject(service.handleDelete(999))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seedTestData([makePaymentMethod({ id: 1 }), makePaymentMethod({ id: 2, name: 'QRIS' })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})
})
