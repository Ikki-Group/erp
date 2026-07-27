import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	StockLedgerFilterDto,
	StockLedgerSelectDto,
	StockSummaryFilterDto,
	StockSummarySelectDto,
} from '@/modules/inventory/stock-summary/stock-summary.contract'
import type { IStockSummaryRepo } from '@/modules/inventory/stock-summary/stock-summary.repo'
import { StockSummaryService } from '@/modules/inventory/stock-summary/stock-summary.service'

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

interface MaterialLocationAssignment {
	materialId: number
	locationId: number
}

class FakeMaterialLocationService {
	async findByLocationId(locationId: number): Promise<MaterialLocationAssignment[]> {
		return locationId === 1 ? [{ materialId: 1, locationId: 1 }] : []
	}
}

class FakeStockSummaryRepo implements IStockSummaryRepo {
	readonly db = noConflictDb
	private summaries = new Map<number, { id: number; deletedAt?: Date }>()
	private seq = 0

	async findByLocationPaginated(
		filter: StockSummaryFilterDto,
	): Promise<WithPaginationResult<StockSummarySelectDto>> {
		return {
			data: [],
			meta: { total: 0, page: filter.page ?? 1, limit: filter.limit ?? 10, totalPages: 0 },
		}
	}

	async findLedgerPaginated(
		filter: StockLedgerFilterDto,
	): Promise<WithPaginationResult<StockLedgerSelectDto>> {
		return {
			data: [],
			meta: { total: 0, page: filter.page ?? 1, limit: filter.limit ?? 10, totalPages: 0 },
		}
	}

	async insertMany(data: { materialId: number; locationId: number }[]): Promise<number> {
		// oxlint-disable-next-line eslint/no-underscore-dangle
		for (const _item of data) {
			const id = ++this.seq
			this.summaries.set(id, { id })
		}
		return data.length
	}

	async softDelete(id: number, _actorId: number): Promise<EntityRef | undefined> {
		const summary = this.summaries.get(id)
		if (!summary) return undefined
		summary.deletedAt = new Date()
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.summaries.has(id)) return undefined
		this.summaries.delete(id)
		return { id }
	}
}

describe('StockSummaryService (unit)', () => {
	let repo: FakeStockSummaryRepo
	let mLocationSvc: FakeMaterialLocationService
	let service: StockSummaryService

	beforeEach(() => {
		repo = new FakeStockSummaryRepo()
		mLocationSvc = new FakeMaterialLocationService()
		service = new StockSummaryService(repo, mLocationSvc as never, createMockCacheClient() as never)
	})

	describe('handleByLocation', () => {
		test('returns paginated stock summaries', async () => {
			const result = await service.handleByLocation({
				locationId: 1,
				dateFrom: new Date('2024-01-01'),
				dateTo: new Date('2024-01-31'),
				page: 1,
				limit: 10,
			})
			expect(result.data).toBeDefined()
			expect(result.meta).toBeDefined()
		})
	})

	describe('handleLedger', () => {
		test('returns paginated stock ledger', async () => {
			const result = await service.handleLedger({
				q: undefined,
				dateFrom: new Date('2024-01-01'),
				dateTo: new Date('2024-01-31'),
				page: 1,
				limit: 10,
			})
			expect(result.data).toBeDefined()
			expect(result.meta).toBeDefined()
		})
	})

	describe('handleRemove', () => {
		test('soft deletes an existing summary', async () => {
			await repo.insertMany([{ materialId: 1, locationId: 1 }])
			const result = await service.handleRemove(1, 1)
			expect(result.id).toBe(1)
		})

		test('throws NotFound when summary does not exist', async () => {
			await expectReject(service.handleRemove(999, 1))
		})
	})

	describe('handleHardRemove', () => {
		test('hard deletes an existing summary', async () => {
			await repo.insertMany([{ materialId: 1, locationId: 1 }])
			const result = await service.handleHardRemove(1)
			expect(result.id).toBe(1)
		})

		test('throws NotFound when summary does not exist', async () => {
			await expectReject(service.handleHardRemove(999))
		})
	})
})
