/**
 * Unit tests for LocationService.
 *
 * These run WITHOUT a database. The service depends on the `ILocationRepo`
 * port, so we pass a typed in-memory fake (no `as any`). The only infra seam
 * that still touches a `db` is `checkConflict`, so the fake repo exposes a
 * tiny `db` stub whose `select(...).from(...).where(...).limit(...)` resolves
 * to "no conflict".
 */

import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	LocationSchema,
	LocationFilterSchema,
	LocationUpdateSchema,
} from '@/modules/location/location.contract'
import type { ILocationRepo } from '@/modules/location/location.repo'
import { LocationService } from '@/modules/location/location.service'

import { createMockCacheClient } from '../helpers/mock-db'
import { beforeEach, describe, expect, test } from 'bun:test'

/** Assert that a promise rejects (type-aware-lint friendly alternative to `.rejects`). */
async function expectReject(promise: Promise<unknown>): Promise<void> {
	let threw = false
	try {
		await promise
	} catch {
		threw = true
	}
	expect(threw).toBe(true)
}

/** A `db` stub that always reports "no conflict" for checkConflict queries. */
const noConflictDb = {
	select: () => ({
		from: () => ({
			where: () => ({
				limit: async () => [] as { id: number }[],
			}),
		}),
	}),
} as unknown as DbContext

/** Typed in-memory fake implementing the ILocationRepo port. */
class FakeLocationRepo implements ILocationRepo {
	readonly db = noConflictDb
	store = new Map<number, LocationSchema>()
	private seq = 0

	seed(rows: LocationSchema[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findMany(_filter: LocationFilterSchema): Promise<LocationSchema[]> {
		return [...this.store.values()]
	}

	async findPage(filter: LocationFilterSchema): Promise<WithPaginationResult<LocationSchema>> {
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

	async findById(id: number): Promise<LocationSchema | undefined> {
		return this.store.get(id)
	}

	async count(): Promise<number> {
		return this.store.size
	}

	async hasReferences(_id: number): Promise<boolean> {
		return false
	}

	async insert(data: Parameters<ILocationRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, { ...(data as unknown as LocationSchema), id })
		return { id }
	}

	async insertMany(items: Parameters<ILocationRepo['insertMany']>[0]): Promise<void> {
		for (const item of items) await this.insert(item)
	}

	async update(
		id: number,
		data: Parameters<ILocationRepo['update']>[1],
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as Partial<LocationSchema>), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

function makeLocation(overrides: Partial<LocationSchema> = {}): LocationSchema {
	return {
		id: 1,
		code: 'WH-001',
		name: 'Warehouse 1',
		type: 'warehouse',
		description: null,
		address: null,
		phone: null,
		isActive: true,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('LocationService (unit)', () => {
	let repo: FakeLocationRepo
	let service: LocationService

	beforeEach(() => {
		repo = new FakeLocationRepo()
		service = new LocationService(repo, createMockCacheClient() as never)
	})

	describe('handleGetById', () => {
		test('returns the location when it exists', async () => {
			repo.seed([makeLocation({ id: 1 })])
			const result = await service.handleGetById(1)
			expect(result.id).toBe(1)
			expect(result.code).toBe('WH-001')
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
					code: 'WH-NEW',
					name: 'New Warehouse',
					type: 'warehouse',
					description: null,
					address: null,
					phone: null,
					isActive: true,
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.code).toBe('WH-NEW')
			expect(stored?.createdBy).toBe(actor)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing location and stamps updatedBy', async () => {
			repo.seed([makeLocation({ id: 1, name: 'Old' })])

			const dto: LocationUpdateSchema = {
				id: 1,
				name: 'Updated',
				type: 'warehouse',
				description: null,
				address: null,
				phone: null,
				isActive: true,
			}
			const result = await service.handleUpdate(dto, 9)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.name).toBe('Updated')
			expect(stored?.updatedBy).toBe(9)
		})

		test('throws NotFound when updating a missing location', async () => {
			const dto: LocationUpdateSchema = {
				id: 404,
				name: 'X',
				type: 'store',
				description: null,
				address: null,
				phone: null,
				isActive: true,
			}
			await expectReject(service.handleUpdate(dto, 1))
		})
	})

	describe('handleDelete', () => {
		test('removes an existing location', async () => {
			repo.seed([makeLocation({ id: 1 })])
			const result = await service.handleDelete(1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing location', async () => {
			await expectReject(service.handleDelete(999))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeLocation({ id: 1 }), makeLocation({ id: 2, code: 'WH-002' })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})
})
