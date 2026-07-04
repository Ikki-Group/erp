import type { DbContext } from '@/infra/database'
import type { EntityRef } from '@/shared/types/utils'

import type {
	JournalEntryDto,
	JournalEntryFilterDto,
	JournalEntryWithItemsDto,
} from '@/modules/finance/general-ledger/general-ledger.contract'
import type { IGeneralLedgerRepo } from '@/modules/finance/general-ledger/general-ledger.repo'
import { GeneralLedgerService } from '@/modules/finance/general-ledger/general-ledger.service'

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
	transaction: async (fn: (tx: any) => Promise<any>) => {
		return fn(noConflictDb)
	},
	insert: () => ({
		values: () => ({
			returning: async () => [{ id: 1 }],
		}),
	}),
} as unknown as DbContext

class FakeGeneralLedgerRepo implements IGeneralLedgerRepo {
	readonly db = noConflictDb
	private entries = new Map<string, JournalEntryWithItemsDto>()
	private seq = 0

	seed(entry: JournalEntryWithItemsDto): void {
		this.entries.set(`${entry.sourceType}.${entry.sourceId}`, entry)
		this.seq = Math.max(this.seq, entry.id)
	}

	async findBySource(
		sourceType: string,
		sourceId: number,
	): Promise<JournalEntryWithItemsDto | undefined> {
		return this.entries.get(`${sourceType}.${sourceId}`)
	}

	async findMany(
		filter?: Partial<Pick<JournalEntryFilterDto, 'sourceType' | 'sourceId'>>,
	): Promise<JournalEntryDto[]> {
		const all = [...this.entries.values()]
		if (!filter) return all
		return all.filter((e) => {
			if (filter.sourceType && e.sourceType !== filter.sourceType) return false
			if (filter.sourceId && e.sourceId !== filter.sourceId) return false
			return true
		})
	}

	async insert(
		data: any,
		items: any[],
		_db?: DbContext,
	): Promise<EntityRef | undefined> {
		const id = ++this.seq
		const entry: JournalEntryWithItemsDto = {
			id,
			date: data.date,
			reference: data.reference,
			sourceType: data.sourceType,
			sourceId: data.sourceId,
			note: data.note,
			createdBy: data.createdBy,
			updatedBy: data.updatedBy,
			createdAt: data.createdAt ?? new Date(),
			updatedAt: data.updatedAt ?? new Date(),
			items: items.map((item, idx) => ({
				id: id * 100 + idx,
				journalEntryId: id,
				accountId: item.accountId,
				debit: item.debit,
				credit: item.credit,
				createdBy: item.createdBy,
				updatedBy: item.updatedBy,
				createdAt: item.createdAt ?? new Date(),
				updatedAt: item.updatedAt ?? new Date(),
			})),
		}
		this.entries.set(`${entry.sourceType}.${entry.sourceId}`, entry)
		return { id }
	}
}

function makeEntry(overrides: Partial<JournalEntryWithItemsDto> = {}): JournalEntryWithItemsDto {
	return {
		id: 1,
		date: new Date(),
		reference: 'JE-001',
		sourceType: 'sales',
		sourceId: 1,
		note: null,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		items: [
			{
				id: 1,
				journalEntryId: 1,
				accountId: 1,
				debit: '100',
				credit: '0',
				createdBy: 1,
				updatedBy: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 2,
				journalEntryId: 1,
				accountId: 2,
				debit: '0',
				credit: '100',
				createdBy: 1,
				updatedBy: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		],
		...overrides,
	}
}

describe('GeneralLedgerService (unit)', () => {
	let repo: FakeGeneralLedgerRepo
	let service: GeneralLedgerService

	beforeEach(() => {
		repo = new FakeGeneralLedgerRepo()
		service = new GeneralLedgerService(repo, createMockCacheClient() as never)
	})

	describe('handleGetBySource', () => {
		test('returns the journal entry when it exists', async () => {
			repo.seed(makeEntry({ id: 1, sourceType: 'sales', sourceId: 100 }))
			const result = await service.handleGetBySource('sales', 100)
			expect(result.id).toBe(1)
			expect(result.sourceType).toBe('sales')
			expect(result.sourceId).toBe(100)
			expect(result.items.length).toBe(2)
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleGetBySource('sales', 999))
		})
	})

	describe('handleCreate', () => {
		test('creates a balanced journal entry and returns a ref', async () => {
			const actor = 7
			const result = await service.handleCreate(
				{
					date: new Date(),
					reference: 'JE-NEW',
					sourceType: 'purchasing',
					sourceId: 10,
					note: null,
					items: [
						{ accountId: 1, debit: '200', credit: '0' },
						{ accountId: 2, debit: '0', credit: '200' },
					],
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findBySource('purchasing', 10)
			expect(stored?.reference).toBe('JE-NEW')
			expect(stored?.createdBy).toBe(actor)
			expect(stored?.items.length).toBe(2)
		})

		test('rejects unbalanced journal entry (debit > credit)', async () => {
			await expectReject(
				service.handleCreate(
					{
						date: new Date(),
						reference: 'JE-UNBALANCED',
						sourceType: 'sales',
						sourceId: 20,
						note: null,
						items: [
							{ accountId: 1, debit: '100', credit: '0' },
							{ accountId: 2, debit: '0', credit: '50' },
						],
					},
					1,
				),
			)
		})

		test('rejects unbalanced journal entry (credit > debit)', async () => {
			await expectReject(
				service.handleCreate(
					{
						date: new Date(),
						reference: 'JE-UNBALANCED',
						sourceType: 'sales',
						sourceId: 21,
						note: null,
						items: [
							{ accountId: 1, debit: '50', credit: '0' },
							{ accountId: 2, debit: '0', credit: '100' },
						],
					},
					1,
				),
			)
		})

		test('accepts balanced entry with zero values', async () => {
			const result = await service.handleCreate(
				{
					date: new Date(),
					reference: 'JE-ZERO',
					sourceType: 'adjustment',
					sourceId: 30,
					note: null,
					items: [
						{ accountId: 1, debit: '0', credit: '0' },
					],
				},
				1,
			)
			expect(result.id).toBeDefined()
		})
	})

	describe('getBySource (internal)', () => {
		test('returns undefined when not found', async () => {
			const result = await service.getBySource('sales', 999)
			expect(result).toBeUndefined()
		})
	})
})
