/**
 * Unit tests for StockTransferService.
 *
 * These run WITHOUT a database. The service depends on the `IStockTransferRepo`
 * port, so we pass a typed in-memory fake (no `as any`).
 */

import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	StockTransferDto,
	StockTransferFilterDto,
	StockTransferSelectDto,
	StockTransferCreateDto,
	StockTransferUpdateDto,
} from '@/modules/inventory/stock-transfer/stock-transfer.contract'
import type { IStockTransferRepo, StockTransferItemInsert } from '@/modules/inventory/stock-transfer/stock-transfer.repo'
import { StockTransferService } from '@/modules/inventory/stock-transfer/stock-transfer.service'

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

const mockDb = {
	select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
} as unknown as DbContext

class FakeStockTransferRepo implements IStockTransferRepo {
	readonly db = mockDb
	private store = new Map<number, StockTransferDto>()
	private seq = 0

	seed(rows: StockTransferDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findById(id: number): Promise<StockTransferDto | undefined> {
		return this.store.get(id)
	}

	async findPage(filter: StockTransferFilterDto): Promise<WithPaginationResult<StockTransferSelectDto>> {
		const data = [...this.store.values()].map(({ items: _, ...rest }) => rest)
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

	async insert(
		data: Parameters<IStockTransferRepo['insert']>[0],
		items: StockTransferItemInsert[],
	): Promise<EntityRef | undefined> {
		const id = ++this.seq
		const fullItems = items.map((item, idx) => ({
			id: idx + 1,
			transferId: id,
			materialId: item.materialId,
			itemName: item.itemName,
			quantity: item.quantity,
			unitCost: item.unitCost,
			totalCost: item.totalCost,
			notes: item.notes ?? null,
			createdBy: item.createdBy,
			updatedBy: item.updatedBy,
			createdAt: item.createdAt ?? new Date(),
			updatedAt: item.updatedAt ?? new Date(),
		}))
		const transfer: StockTransferDto = {
			id,
			sourceLocationId: data.sourceLocationId ?? 1,
			destinationLocationId: data.destinationLocationId ?? 2,
			status: data.status ?? 'pending_approval',
			transferDate: data.transferDate ?? new Date(),
			expectedDate: data.expectedDate ?? undefined,
			receivedDate: data.receivedDate ?? undefined,
			referenceNo: data.referenceNo ?? 'TRF-001',
			notes: data.notes ?? null,
			rejectionReason: null,
			items: fullItems,
			createdBy: data.createdBy,
			updatedBy: data.updatedBy,
			createdAt: data.createdAt ?? new Date(),
			updatedAt: data.updatedAt ?? new Date(),
		}
		this.store.set(id, transfer)
		return { id }
	}

	async update(
		id: number,
		data: Parameters<IStockTransferRepo['update']>[1],
		items: StockTransferItemInsert[] | undefined,
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		const updated = { ...existing, ...data, id }
		if (items !== undefined) {
			updated.items = items.map((item, idx) => ({
				id: idx + 1,
				transferId: id,
				materialId: item.materialId,
				itemName: item.itemName,
				quantity: item.quantity,
				unitCost: item.unitCost,
				totalCost: item.totalCost,
				notes: item.notes ?? null,
				createdBy: item.createdBy,
				updatedBy: item.updatedBy,
				createdAt: item.createdAt ?? new Date(),
				updatedAt: item.updatedAt ?? new Date(),
			}))
		}
		this.store.set(id, updated as StockTransferDto)
		return { id }
	}

	async softDelete(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}

	async updateStatus(id: number, status: StockTransferDto['status']): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, status })
		return { id }
	}

	async updateStatusWithReason(id: number, status: StockTransferDto['status'], reason: string): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, status, rejectionReason: reason })
		return { id }
	}

	async updateReceivedDate(id: number, receivedDate: Date): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, receivedDate })
		return { id }
	}
}

function makeTransfer(overrides: Partial<StockTransferDto> = {}): StockTransferDto {
	return {
		id: 1,
		sourceLocationId: 1,
		destinationLocationId: 2,
		status: 'pending_approval',
		transferDate: new Date(),
		expectedDate: null,
		receivedDate: null,
		referenceNo: 'TRF-001',
		notes: null,
		rejectionReason: null,
		items: [],
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('StockTransferService (unit)', () => {
	let repo: FakeStockTransferRepo
	let service: StockTransferService

	beforeEach(() => {
		repo = new FakeStockTransferRepo()
		service = new StockTransferService(repo, createMockCacheClient() as never)
	})

	describe('handleDetail', () => {
		test('returns the transfer when it exists', async () => {
			repo.seed([makeTransfer({ id: 1 })])
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
			expect(result.referenceNo).toBe('TRF-001')
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleDetail(999))
		})
	})

	describe('handleCreate', () => {
		test('creates and returns a ref', async () => {
			const actor = 7
			const data: StockTransferCreateDto = {
				sourceLocationId: 1,
				destinationLocationId: 2,
				referenceNo: 'TRF-NEW',
				transferDate: new Date(),
				status: 'pending_approval',
				notes: null,
				items: [
					{
						materialId: 1,
						itemName: 'Material A',
						quantity: '10',
						unitCost: '100',
						totalCost: '1000',
						notes: null,
					},
				],
			}
			const result = await service.handleCreate(data, actor)
			expect(result.id).toBeDefined()
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing transfer', async () => {
			repo.seed([makeTransfer({ id: 1, status: 'pending_approval' })])

			const dto: StockTransferUpdateDto = {
				id: 1,
				sourceLocationId: 1,
				destinationLocationId: 2,
				referenceNo: 'TRF-UPDATED',
				transferDate: new Date(),
				status: 'pending_approval',
				notes: null,
				items: [],
			}
			const result = await service.handleUpdate(dto, 9)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.referenceNo).toBe('TRF-UPDATED')
		})

		test('throws NotFound when updating a missing transfer', async () => {
			const dto: StockTransferUpdateDto = {
				id: 404,
				sourceLocationId: 1,
				destinationLocationId: 2,
				referenceNo: 'X',
				transferDate: new Date(),
				status: 'pending_approval',
				notes: null,
				items: [],
			}
			await expectReject(service.handleUpdate(dto, 1))
		})
	})

	describe('handleRemove', () => {
		test('removes an existing transfer', async () => {
			repo.seed([makeTransfer({ id: 1 })])
			const result = await service.handleRemove(1, 1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing transfer', async () => {
			await expectReject(service.handleRemove(999, 1))
		})
	})

	describe('handleApprove', () => {
		test('approves a pending transfer', async () => {
			repo.seed([makeTransfer({ id: 1, status: 'pending_approval' })])
			const result = await service.handleApprove({ id: 1, notes: undefined }, 1)
			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.status).toBe('approved')
		})

		test('throws invalid status when not pending', async () => {
			repo.seed([makeTransfer({ id: 1, status: 'completed' })])
			await expectReject(service.handleApprove({ id: 1, notes: undefined }, 1))
		})
	})

	describe('handleReject', () => {
		test('rejects a pending transfer with reason', async () => {
			repo.seed([makeTransfer({ id: 1, status: 'pending_approval' })])
			const result = await service.handleReject({ id: 1, reason: 'Invalid request' }, 1)
			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.status).toBe('rejected')
			expect(stored?.rejectionReason).toBe('Invalid request')
		})
	})

	describe('handleMarkInTransit', () => {
		test('marks approved transfer as in_transit', async () => {
			repo.seed([makeTransfer({ id: 1, status: 'approved' })])
			const result = await service.handleMarkInTransit({ id: 1 }, 1)
			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.status).toBe('in_transit')
		})

		test('throws invalid status when not approved', async () => {
			repo.seed([makeTransfer({ id: 1, status: 'pending_approval' })])
			await expectReject(service.handleMarkInTransit({ id: 1 }, 1))
		})
	})

	describe('handleMarkCompleted', () => {
		test('marks in_transit transfer as completed', async () => {
			repo.seed([makeTransfer({ id: 1, status: 'in_transit' })])
			const result = await service.handleMarkCompleted({ id: 1 }, 1)
			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.status).toBe('completed')
			expect(stored?.receivedDate).toBeDefined()
		})
	})

	describe('handleCancel', () => {
		test('cancels pending_approval transfer', async () => {
			repo.seed([makeTransfer({ id: 1, status: 'pending_approval' })])
			const result = await service.handleCancel({ id: 1, reason: 'No longer needed' }, 1)
			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.status).toBe('cancelled')
		})

		test('cancels approved transfer', async () => {
			repo.seed([makeTransfer({ id: 1, status: 'approved' })])
			const result = await service.handleCancel({ id: 1, reason: 'Emergency' }, 1)
			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.status).toBe('cancelled')
		})

		test('throws invalid status when in_transit', async () => {
			repo.seed([makeTransfer({ id: 1, status: 'in_transit' })])
			await expectReject(service.handleCancel({ id: 1, reason: 'Too late' }, 1))
		})
	})
})
