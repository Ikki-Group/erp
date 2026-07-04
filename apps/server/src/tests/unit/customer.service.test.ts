import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	CustomerDto,
	CustomerFilterDto,
	CustomerUpdateDto,
	CustomerAddPointsDto,
	CustomerRedeemPointsDto,
	CustomerLoyaltyTransactionDto,
} from '@/modules/crm/customer.contract'
import type { ICustomerRepo } from '@/modules/crm/customer.repo'
import { CustomerService } from '@/modules/crm/customer.service'

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

class FakeCustomerRepo implements ICustomerRepo {
	readonly db = noConflictDb
	store = new Map<number, CustomerDto>()
	loyaltyStore = new Map<number, CustomerLoyaltyTransactionDto>()
	private seq = 0
	private loyaltySeq = 0

	seed(rows: CustomerDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findMany(): Promise<CustomerDto[]> {
		return [...this.store.values()]
	}

	async findPage(filter: CustomerFilterDto): Promise<WithPaginationResult<CustomerDto>> {
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

	async findById(id: number): Promise<CustomerDto | undefined> {
		return this.store.get(id)
	}

	async findByPhone(phone: string): Promise<CustomerDto | undefined> {
		for (const customer of this.store.values()) {
			if (customer.phone === phone) return customer
		}
		return undefined
	}

	async findLoyaltyHistory(customerId: number): Promise<CustomerLoyaltyTransactionDto[]> {
		return [...this.loyaltyStore.values()].filter((t) => t.customerId === customerId)
	}

	async insert(
		data: Parameters<ICustomerRepo['insert']>[0],
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const id = ++this.seq
		const now = new Date()
		const customer: CustomerDto = {
			id,
			code: data.code,
			name: data.name,
			email: data.email ?? null,
			phone: data.phone ?? null,
			address: data.address ?? null,
			taxId: data.taxId ?? null,
			dateOfBirth: data.dateOfBirth ?? null,
			tier: 'bronze',
			pointsBalance: 0,
			totalPointsEarned: 0,
			registeredAt: now,
			lastVisitAt: null,
			createdBy: actorId,
			updatedBy: actorId,
			createdAt: now,
			updatedAt: now,
		}
		this.store.set(id, customer)
		return { id }
	}

	async update(
		id: number,
		data: Parameters<ICustomerRepo['update']>[1],
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		const updated: CustomerDto = {
			...existing,
			...(data as Partial<CustomerDto>),
			id,
			updatedBy: actorId,
			updatedAt: new Date(),
		}
		this.store.set(id, updated)
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}

	async addPoints(
		data: Parameters<ICustomerRepo['addPoints']>[0],
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const customer = this.store.get(data.customerId)
		if (!customer) return undefined

		const newBalance = customer.pointsBalance + data.points
		const totalEarned = customer.totalPointsEarned + data.points

		this.store.set(data.customerId, {
			...customer,
			pointsBalance: newBalance,
			totalPointsEarned: totalEarned,
			updatedBy: actorId,
			updatedAt: new Date(),
		})

		const id = ++this.loyaltySeq
		const txn: CustomerLoyaltyTransactionDto = {
			id,
			customerId: data.customerId,
			type: 'earned',
			points: data.points,
			balanceAfter: newBalance,
			referenceType: data.referenceType ?? null,
			referenceId: data.referenceId ?? null,
			description: data.description,
			createdBy: actorId,
			updatedBy: actorId,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.loyaltyStore.set(id, txn)
		return { id }
	}

	async redeemPoints(
		data: Parameters<ICustomerRepo['redeemPoints']>[0],
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const customer = this.store.get(data.customerId)
		if (!customer) return undefined

		if (customer.pointsBalance < data.points) {
			throw new Error('Insufficient points balance')
		}

		const newBalance = customer.pointsBalance - data.points

		this.store.set(data.customerId, {
			...customer,
			pointsBalance: newBalance,
			updatedBy: actorId,
			updatedAt: new Date(),
		})

		const id = ++this.loyaltySeq
		const txn: CustomerLoyaltyTransactionDto = {
			id,
			customerId: data.customerId,
			type: 'redeemed',
			points: -data.points,
			balanceAfter: newBalance,
			referenceType: data.referenceType ?? null,
			referenceId: data.referenceId ?? null,
			description: data.description,
			createdBy: actorId,
			updatedBy: actorId,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.loyaltyStore.set(id, txn)
		return { id }
	}

	async updateLastVisit(customerId: number): Promise<void> {
		const customer = this.store.get(customerId)
		if (customer) {
			this.store.set(customerId, {
				...customer,
				lastVisitAt: new Date(),
			})
		}
	}
}

function makeCustomer(overrides: Partial<CustomerDto> = {}): CustomerDto {
	return {
		id: 1,
		code: 'CUST001',
		name: 'John Doe',
		email: 'john@example.com',
		phone: '+1234567890',
		address: '123 Main St',
		taxId: null,
		dateOfBirth: null,
		tier: 'bronze',
		pointsBalance: 100,
		totalPointsEarned: 100,
		registeredAt: new Date(),
		lastVisitAt: null,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('CustomerService (unit)', () => {
	let repo: FakeCustomerRepo
	let service: CustomerService

	beforeEach(() => {
		repo = new FakeCustomerRepo()
		service = new CustomerService(repo, createMockCacheClient() as never)
	})

	describe('handleGetById', () => {
		test('returns the customer when it exists', async () => {
			repo.seed([makeCustomer({ id: 1 })])
			const result = await service.handleGetById(1)
			expect(result.id).toBe(1)
			expect(result.code).toBe('CUST001')
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
					code: 'NEW001',
					name: 'New Customer',
					email: undefined,
					phone: undefined,
					address: undefined,
					taxId: undefined,
					dateOfBirth: undefined,
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.code).toBe('NEW001')
			expect(stored?.createdBy).toBe(actor)
			expect(stored?.tier).toBe('bronze')
			expect(stored?.pointsBalance).toBe(0)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing customer and stamps updatedBy', async () => {
			repo.seed([makeCustomer({ id: 1, name: 'Old Name' })])

			const dto: CustomerUpdateDto = {
				id: 1,
				name: 'Updated Name',
				email: undefined,
				phone: undefined,
				address: undefined,
				taxId: undefined,
				dateOfBirth: undefined,
			}
			const result = await service.handleUpdate(dto, 9)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.name).toBe('Updated Name')
			expect(stored?.updatedBy).toBe(9)
		})

		test('throws NotFound when updating a missing customer', async () => {
			const dto: CustomerUpdateDto = {
				id: 404,
				name: undefined,
				email: undefined,
				phone: undefined,
				address: undefined,
				taxId: undefined,
				dateOfBirth: undefined,
			}
			await expectReject(service.handleUpdate(dto, 1))
		})
	})

	describe('handleRemove', () => {
		test('removes an existing customer', async () => {
			repo.seed([makeCustomer({ id: 1 })])
			const result = await service.handleRemove(1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing customer', async () => {
			await expectReject(service.handleRemove(999))
		})
	})

	describe('handleAddPoints', () => {
		test('adds points to customer balance', async () => {
			repo.seed([makeCustomer({ id: 1, pointsBalance: 100 })])

			const dto: CustomerAddPointsDto = {
				customerId: 1,
				points: 50,
				description: 'Test points',
			}
			const result = await service.handleAddPoints(dto, 1)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(1)
			expect(stored?.pointsBalance).toBe(150)
			expect(stored?.totalPointsEarned).toBe(150)
		})

		test('throws NotFound when customer missing', async () => {
			const dto: CustomerAddPointsDto = {
				customerId: 404,
				points: 50,
				description: 'Test',
			}
			await expectReject(service.handleAddPoints(dto, 1))
		})
	})

	describe('handleRedeemPoints', () => {
		test('redeems points from customer balance', async () => {
			repo.seed([makeCustomer({ id: 1, pointsBalance: 100 })])

			const dto: CustomerRedeemPointsDto = {
				customerId: 1,
				points: 30,
				description: 'Redemption',
			}
			const result = await service.handleRedeemPoints(dto, 1)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(1)
			expect(stored?.pointsBalance).toBe(70)
		})

		test('throws error when insufficient points', async () => {
			repo.seed([makeCustomer({ id: 1, pointsBalance: 10 })])

			const dto: CustomerRedeemPointsDto = {
				customerId: 1,
				points: 50,
				description: 'Redemption',
			}
			await expectReject(service.handleRedeemPoints(dto, 1))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeCustomer({ id: 1 }), makeCustomer({ id: 2, code: 'CUST002' })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})

	describe('handleGetByPhone', () => {
		test('returns customer by phone', async () => {
			repo.seed([makeCustomer({ id: 1, phone: '+1234567890' })])
			const result = await service.handleGetByPhone('+1234567890')
			expect(result.id).toBe(1)
		})

		test('throws NotFound when phone not found', async () => {
			await expectReject(service.handleGetByPhone('+9999999999'))
		})
	})
})
