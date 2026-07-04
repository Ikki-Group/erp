import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'

import type {
	StockAlertCountFilterDto,
	StockAlertFilterDto,
	StockAlertSelectDto,
} from '@/modules/inventory/stock-alert/stock-alert.contract'
import type { IStockAlertRepo } from '@/modules/inventory/stock-alert/stock-alert.repo'
import { StockAlertService } from '@/modules/inventory/stock-alert/stock-alert.service'

import { createMockCacheClient } from '../helpers/mock-db'
import { beforeEach, describe, expect, test } from 'bun:test'

const noConflictDb = {
	select: () => ({
		from: () => ({
			where: () => ({
				limit: async () => [] as { id: number }[],
			}),
		}),
	}),
} as unknown as DbContext

class FakeStockAlertRepo implements IStockAlertRepo {
	readonly db = noConflictDb
	private alerts: StockAlertSelectDto[] = []

	seed(alerts: StockAlertSelectDto[]): void {
		this.alerts = alerts
	}

	async findAlertsPage(filter: StockAlertFilterDto): Promise<WithPaginationResult<StockAlertSelectDto>> {
		const page = filter.page ?? 1
		const limit = filter.limit ?? 20
		const data = this.alerts.filter((a) => {
			if (filter.locationId && a.locationId !== filter.locationId) return false
			return true
		})
		return {
			data,
			meta: { total: data.length, page, limit, totalPages: Math.ceil(data.length / limit) },
		}
	}

	async findAlertCount(filter: StockAlertCountFilterDto): Promise<{ count: number }> {
		const data = this.alerts.filter((a) => {
			if (filter.locationId && a.locationId !== filter.locationId) return false
			return true
		})
		return { count: data.length }
	}
}

function makeAlert(overrides: Partial<StockAlertSelectDto> = {}): StockAlertSelectDto {
	return {
		materialId: 1,
		materialName: 'Material 1',
		materialSku: 'SKU-001',
		locationId: 1,
		locationName: 'Warehouse 1',
		uomCode: 'PCS',
		currentQty: 5,
		minStock: 10,
		reorderPoint: 15,
		...overrides,
	}
}

describe('StockAlertService (unit)', () => {
	let repo: FakeStockAlertRepo
	let service: StockAlertService

	beforeEach(() => {
		repo = new FakeStockAlertRepo()
		service = new StockAlertService(repo, createMockCacheClient() as never)
	})

	describe('handleAlerts', () => {
		test('returns paginated stock alerts', async () => {
			repo.seed([makeAlert({ materialId: 1 }), makeAlert({ materialId: 2 })])

			const result = await service.handleAlerts({ page: 1, limit: 10, type: 'all' })

			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})

		test('filters by locationId', async () => {
			repo.seed([
				makeAlert({ materialId: 1, locationId: 1 }),
				makeAlert({ materialId: 2, locationId: 2 }),
			])

			const result = await service.handleAlerts({ locationId: 1, page: 1, limit: 10, type: 'all' })

			expect(result.data.length).toBe(1)
			expect(result.data[0]!.locationId).toBe(1)
		})
	})

	describe('handleCount', () => {
		test('returns alert count', async () => {
			repo.seed([makeAlert({ materialId: 1 }), makeAlert({ materialId: 2 })])

			const result = await service.handleCount({ type: 'all' })

			expect(result.count).toBe(2)
		})

		test('filters count by locationId', async () => {
			repo.seed([
				makeAlert({ materialId: 1, locationId: 1 }),
				makeAlert({ materialId: 2, locationId: 2 }),
			])

			const result = await service.handleCount({ locationId: 1, type: 'all' })

			expect(result.count).toBe(1)
		})
	})
})
