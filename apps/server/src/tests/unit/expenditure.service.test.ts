/**
 * Unit tests for ExpenditureService.
 *
 * These run WITHOUT a database. The service depends on the `IExpenditureRepo`
 * port, so we pass a typed in-memory fake (no `as any`). The journal port
 * is also faked to capture GL posting calls.
 */

import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	ExpenditureDto,
	ExpenditureFilterDto,
	ExpenditureCreateDto,
	ExpenditureUpdateDto,
} from '@/modules/finance/expenditure/expenditure.contract'
import type { IExpenditureRepo } from '@/modules/finance/expenditure/expenditure.repo'
import { ExpenditureService, type JournalPostPort } from '@/modules/finance/expenditure/expenditure.service'

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

class FakeExpenditureRepo implements IExpenditureRepo {
	readonly db = noConflictDb
	store = new Map<number, ExpenditureDto>()
	private seq = 0

	seed(rows: ExpenditureDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findMany(_filter?: Partial<ExpenditureFilterDto>): Promise<ExpenditureDto[]> {
		return [...this.store.values()]
	}

	async findPage(filter: ExpenditureFilterDto): Promise<WithPaginationResult<ExpenditureDto>> {
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

	async findById(id: number): Promise<ExpenditureDto | undefined> {
		return this.store.get(id)
	}

	async insert(data: Parameters<IExpenditureRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, { ...(data as unknown as ExpenditureDto), id })
		return { id }
	}

	async update(
		id: number,
		data: Parameters<IExpenditureRepo['update']>[1],
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as Partial<ExpenditureDto>), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

class FakeJournalPort implements JournalPostPort {
postedEntries: Array<{ input: Parameters<JournalPostPort['postEntry']>[0]; actorId: number }> = []

	async postEntry(
		input: Parameters<JournalPostPort['postEntry']>[0],
		actorId: number,
	): Promise<{ id: number }> {
		this.postedEntries.push({ input, actorId })
		return { id: 100 }
	}
}

function makeExpenditure(overrides: Partial<ExpenditureDto> = {}): ExpenditureDto {
	return {
		id: 1,
		type: 'BILLS',
		status: 'PAID',
		title: 'Test Expenditure',
		description: null,
		date: new Date(),
		amount: '100.00',
		sourceAccountId: 1,
		targetAccountId: 2,
		liabilityAccountId: null,
		supplierId: null,
		locationId: 1,
		isInstallment: false,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('ExpenditureService (unit)', () => {
	let repo: FakeExpenditureRepo
	let journal: FakeJournalPort
	let service: ExpenditureService

	beforeEach(() => {
		repo = new FakeExpenditureRepo()
		journal = new FakeJournalPort()
		service = new ExpenditureService(journal, repo, createMockCacheClient() as never)
	})

	describe('handleGetById', () => {
		test('returns the expenditure when it exists', async () => {
			repo.seed([makeExpenditure({ id: 1 })])
			const result = await service.handleGetById(1)
			expect(result.id).toBe(1)
			expect(result.title).toBe('Test Expenditure')
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleGetById(999))
		})
	})

	describe('handleCreate', () => {
		test('creates expenditure and posts to journal', async () => {
			const dto: ExpenditureCreateDto = {
				type: 'BILLS',
				status: 'PAID',
				title: 'New Expense',
				description: null,
				date: new Date(),
				amount: '50.00',
				sourceAccountId: 1,
				targetAccountId: 2,
				locationId: 1,
				isInstallment: false,
			}
			const actor = 7

			const result = await service.handleCreate(dto, actor)
			expect(result.id).toBeDefined()

			expect(journal.postedEntries.length).toBe(1)
			const entry = journal.postedEntries[0]!
			expect(entry.input.sourceType).toBe('expenditure')
			expect(entry.input.sourceId).toBe(result.id)
			expect(entry.actorId).toBe(actor)
		})

		test('handles installment with liability account', async () => {
			const dto: ExpenditureCreateDto = {
				type: 'BILLS',
				status: 'PENDING',
				title: 'Installment Expense',
				description: null,
				date: new Date(),
				amount: '100.00',
				sourceAccountId: 1,
				targetAccountId: 2,
				liabilityAccountId: 3,
				locationId: 1,
				isInstallment: true,
			}

			await service.handleCreate(dto, 1)
			expect(journal.postedEntries.length).toBe(1)
			expect(journal.postedEntries[0]!.input.items.length).toBe(2)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing expenditure', async () => {
			repo.seed([makeExpenditure({ id: 1, title: 'Old Title' })])

			const dto: ExpenditureUpdateDto = {
				id: 1,
				type: 'BILLS',
				status: 'PAID',
				title: 'Updated Title',
				description: null,
				date: new Date(),
				amount: '100.00',
				sourceAccountId: 1,
				targetAccountId: 2,
				locationId: 1,
				isInstallment: false,
			}

			const result = await service.handleUpdate(dto, 9)
			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.title).toBe('Updated Title')
		})

		test('throws NotFound when updating a missing expenditure', async () => {
			const dto: ExpenditureUpdateDto = {
				id: 404,
				type: 'BILLS',
				status: 'PAID',
				title: 'X',
				description: null,
				date: new Date(),
				amount: '10.00',
				sourceAccountId: 1,
				targetAccountId: 2,
				locationId: 1,
				isInstallment: false,
			}
			await expectReject(service.handleUpdate(dto, 1))
		})
	})

	describe('handleDelete', () => {
		test('removes an existing expenditure', async () => {
			repo.seed([makeExpenditure({ id: 1 })])
			const result = await service.handleDelete(1, 1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing expenditure', async () => {
			await expectReject(service.handleDelete(999, 1))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeExpenditure({ id: 1 }), makeExpenditure({ id: 2, title: 'Second' })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})
})
