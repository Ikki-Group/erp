import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	LocationPaymentMethodDto,
	LocationPaymentMethodFilterDto,
	LocationPaymentMethodUpdateDto,
} from '@/modules/payment/location-payment-method/location-payment-method.contract'
import type { ILocationPaymentMethodRepo } from '@/modules/payment/location-payment-method/location-payment-method.repo'
import {
	LocationPaymentMethodService,
	type LocationReadPort,
	type PaymentMethodReadPort,
} from '@/modules/payment/location-payment-method/location-payment-method.service'

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

class FakeLocationPaymentMethodRepo implements ILocationPaymentMethodRepo {
	readonly db = noConflictDb
	store = new Map<number, LocationPaymentMethodDto>()
	private seq = 0

	seed(rows: LocationPaymentMethodDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findById(id: number): Promise<LocationPaymentMethodDto | undefined> {
		return this.store.get(id)
	}

	async findByLocation(locationId: number): Promise<LocationPaymentMethodDto[]> {
		return [...this.store.values()].filter((x) => x.locationId === locationId)
	}

	async findPage(filter: LocationPaymentMethodFilterDto): Promise<WithPaginationResult<LocationPaymentMethodDto>> {
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

	async insert(data: Parameters<ILocationPaymentMethodRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, { ...(data as unknown as LocationPaymentMethodDto), id })
		return { id }
	}

	async update(
		id: number,
		data: Parameters<ILocationPaymentMethodRepo['update']>[1],
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as Partial<LocationPaymentMethodDto>), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}

	async removeByLocation(locationId: number): Promise<number> {
		const toDelete = [...this.store.values()].filter((x) => x.locationId === locationId)
		for (const item of toDelete) {
			this.store.delete(item.id)
		}
		return toDelete.length
	}

	async unsetDefaultForLocation(locationId: number): Promise<void> {
		for (const [id, item] of this.store.entries()) {
			if (item.locationId === locationId && item.isDefault) {
				this.store.set(id, { ...item, isDefault: false })
			}
		}
	}
}

class FakeLocationReadPort implements LocationReadPort {
	private locations = new Map<number, { id: number; type: string }>()

	seed(rows: { id: number; type: string }[]): void {
		for (const r of rows) {
			this.locations.set(r.id, r)
		}
	}

	async getById(id: number): Promise<{ id: number; type: string } | undefined> {
		return this.locations.get(id)
	}
}

class FakePaymentMethodReadPort implements PaymentMethodReadPort {
	private paymentMethods = new Map<number, { id: number }>()

	seed(rows: { id: number }[]): void {
		for (const r of rows) {
			this.paymentMethods.set(r.id, r)
		}
	}

	async getById(id: number): Promise<{ id: number } | undefined> {
		return this.paymentMethods.get(id)
	}
}

function makeLocationPaymentMethod(
	overrides: Partial<LocationPaymentMethodDto> = {},
): LocationPaymentMethodDto {
	return {
		id: 1,
		locationId: 1,
		paymentMethodId: 1,
		paymentProviderId: null,
		isEnabled: true,
		isDefault: false,
		credentials: null,
		config: null,
		enabledAt: null,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('LocationPaymentMethodService (unit)', () => {
	let repo: FakeLocationPaymentMethodRepo
	let locationPort: FakeLocationReadPort
	let paymentMethodPort: FakePaymentMethodReadPort
	let service: LocationPaymentMethodService

	beforeEach(() => {
		repo = new FakeLocationPaymentMethodRepo()
		locationPort = new FakeLocationReadPort()
		paymentMethodPort = new FakePaymentMethodReadPort()
		service = new LocationPaymentMethodService(
			repo,
			createMockCacheClient() as never,
			{
				location: locationPort,
				paymentMethod: paymentMethodPort,
			},
		)
	})

	describe('handleGetById', () => {
		test('returns the location payment method when it exists', async () => {
			repo.seed([makeLocationPaymentMethod({ id: 1 })])
			const result = await service.handleGetById(1)
			expect(result.id).toBe(1)
			expect(result.locationId).toBe(1)
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleGetById(999))
		})
	})

	describe('handleCreate', () => {
		test('creates and returns a ref with audit stamp', async () => {
			locationPort.seed([{ id: 1, type: 'store' }])
			paymentMethodPort.seed([{ id: 1 }])

			const actor = 7
			const result = await service.handleCreate(
				{
					locationId: 1,
					paymentMethodId: 1,
					paymentProviderId: null,
					isEnabled: true,
					isDefault: false,
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.locationId).toBe(1)
			expect(stored?.createdBy).toBe(actor)
		})

		test('throws locationNotFound when location missing', async () => {
			paymentMethodPort.seed([{ id: 1 }])
			await expectReject(
				service.handleCreate(
					{
						locationId: 999,
						paymentMethodId: 1,
						paymentProviderId: null,
						isEnabled: true,
						isDefault: false,
					},
					1,
				),
			)
		})

		test('throws invalidLocationType when location is not a store', async () => {
			locationPort.seed([{ id: 1, type: 'warehouse' }])
			paymentMethodPort.seed([{ id: 1 }])

			await expectReject(
				service.handleCreate(
					{
						locationId: 1,
						paymentMethodId: 1,
						paymentProviderId: null,
						isEnabled: true,
						isDefault: false,
					},
					1,
				),
			)
		})

		test('throws paymentMethodNotFound when payment method missing', async () => {
			locationPort.seed([{ id: 1, type: 'store' }])

			await expectReject(
				service.handleCreate(
					{
						locationId: 1,
						paymentMethodId: 999,
						paymentProviderId: null,
						isEnabled: true,
						isDefault: false,
					},
					1,
				),
			)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing location payment method and stamps updatedBy', async () => {
			locationPort.seed([{ id: 1, type: 'store' }])
			paymentMethodPort.seed([{ id: 1 }])
			repo.seed([makeLocationPaymentMethod({ id: 1, locationId: 1, paymentMethodId: 1 })])

			const dto: LocationPaymentMethodUpdateDto = {
				id: 1,
				locationId: 1,
				paymentMethodId: 1,
				paymentProviderId: null,
				isEnabled: false,
				isDefault: false,
			}
			const result = await service.handleUpdate(dto, 9)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.isEnabled).toBe(false)
			expect(stored?.updatedBy).toBe(9)
		})

		test('throws NotFound when updating a missing location payment method', async () => {
			const dto: LocationPaymentMethodUpdateDto = {
				id: 404,
				locationId: 1,
				paymentMethodId: 1,
				paymentProviderId: null,
				isEnabled: true,
				isDefault: false,
			}
			await expectReject(service.handleUpdate(dto, 1))
		})
	})

	describe('handleRemove', () => {
		test('removes an existing location payment method', async () => {
			repo.seed([makeLocationPaymentMethod({ id: 1 })])
			const result = await service.handleRemove(1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing location payment method', async () => {
			await expectReject(service.handleRemove(999))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([
				makeLocationPaymentMethod({ id: 1 }),
				makeLocationPaymentMethod({ id: 2, paymentMethodId: 2 }),
			])
			const result = await service.handleList({ page: 1, limit: 10 })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})

	describe('handleGetByLocation', () => {
		test('returns all payment methods for a location', async () => {
			repo.seed([
				makeLocationPaymentMethod({ id: 1, locationId: 1 }),
				makeLocationPaymentMethod({ id: 2, locationId: 1, paymentMethodId: 2 }),
				makeLocationPaymentMethod({ id: 3, locationId: 2 }),
			])
			const result = await service.handleGetByLocation(1)
			expect(result.length).toBe(2)
			expect(result.every((x) => x.locationId === 1)).toBe(true)
		})
	})
})
