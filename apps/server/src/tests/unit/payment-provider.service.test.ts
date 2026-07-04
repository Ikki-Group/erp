import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	PaymentProviderDto,
	PaymentProviderFilterDto,
	PaymentProviderUpdateDto,
} from '@/modules/payment/payment-provider/payment-provider.contract'
import type { IPaymentProviderRepo } from '@/modules/payment/payment-provider/payment-provider.repo'
import { PaymentProviderService } from '@/modules/payment/payment-provider/payment-provider.service'

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

class FakePaymentProviderRepo implements IPaymentProviderRepo {
	readonly db = noConflictDb
	store = new Map<number, PaymentProviderDto>()
	private seq = 0

	seed(rows: PaymentProviderDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findMany(): Promise<PaymentProviderDto[]> {
		return [...this.store.values()]
	}

	async findPage(
		filter: PaymentProviderFilterDto,
	): Promise<WithPaginationResult<PaymentProviderDto>> {
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

	async findById(id: number): Promise<PaymentProviderDto | undefined> {
		return this.store.get(id)
	}

	async findByCode(code: string): Promise<PaymentProviderDto | undefined> {
		return [...this.store.values()].find((p) => p.code === code)
	}

	async count(): Promise<number> {
		return this.store.size
	}

	async insert(
		data: Parameters<IPaymentProviderRepo['insert']>[0],
	): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, { ...(data as unknown as PaymentProviderDto), id })
		return { id }
	}

	async update(
		id: number,
		data: Parameters<IPaymentProviderRepo['update']>[1],
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as Partial<PaymentProviderDto>), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

function makePaymentProvider(
	overrides: Partial<PaymentProviderDto> = {},
): PaymentProviderDto {
	return {
		id: 1,
		code: 'BCA',
		name: 'Bank Central Asia',
		description: null,
		websiteUrl: null,
		isActive: true,
		isSystem: false,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('PaymentProviderService (unit)', () => {
	let repo: FakePaymentProviderRepo
	let service: PaymentProviderService

	beforeEach(() => {
		repo = new FakePaymentProviderRepo()
		service = new PaymentProviderService(repo, createMockCacheClient() as never)
	})

	describe('handleGetById', () => {
		test('returns the provider when it exists', async () => {
			repo.seed([makePaymentProvider({ id: 1 })])
			const result = await service.handleGetById(1)
			expect(result.id).toBe(1)
			expect(result.code).toBe('BCA')
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
					code: 'BNI',
					name: 'Bank Negara Indonesia',
					description: null,
					websiteUrl: null,
					isActive: true,
					isSystem: false,
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.code).toBe('BNI')
			expect(stored?.createdBy).toBe(actor)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing provider and stamps updatedBy', async () => {
			repo.seed([makePaymentProvider({ id: 1, name: 'Old' })])

			const dto: PaymentProviderUpdateDto = {
				id: 1,
				code: 'BCA',
				name: 'Updated',
				description: null,
				websiteUrl: null,
				isActive: true,
				isSystem: false,
			}
			const result = await service.handleUpdate(dto, 9)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.name).toBe('Updated')
			expect(stored?.updatedBy).toBe(9)
		})

		test('throws NotFound when updating a missing provider', async () => {
			const dto: PaymentProviderUpdateDto = {
				id: 404,
				code: 'X',
				name: 'X',
				description: null,
				websiteUrl: null,
				isActive: true,
				isSystem: false,
			}
			await expectReject(service.handleUpdate(dto, 1))
		})

		test('throws error when updating a system provider', async () => {
			repo.seed([makePaymentProvider({ id: 1, isSystem: true })])
			const dto: PaymentProviderUpdateDto = {
				id: 1,
				code: 'BCA',
				name: 'Updated',
				description: null,
				websiteUrl: null,
				isActive: true,
				isSystem: true,
			}
			await expectReject(service.handleUpdate(dto, 9))
		})
	})

	describe('handleRemove', () => {
		test('removes an existing provider', async () => {
			repo.seed([makePaymentProvider({ id: 1 })])
			const result = await service.handleRemove(1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing provider', async () => {
			await expectReject(service.handleRemove(999))
		})

		test('throws error when deleting a system provider', async () => {
			repo.seed([makePaymentProvider({ id: 1, isSystem: true })])
			await expectReject(service.handleRemove(1))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([
				makePaymentProvider({ id: 1 }),
				makePaymentProvider({ id: 2, code: 'BNI' }),
			])
			const result = await service.handleList({
				page: 1,
				limit: 10,
				q: undefined,
			})
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})
})
