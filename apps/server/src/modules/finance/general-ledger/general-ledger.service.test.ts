import { GeneralLedgerRepo } from './general-ledger.repo'
import type { JournalEntryInput, JournalItemInput } from './general-ledger.repo'
import { GeneralLedgerService } from './general-ledger.service'
import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

describe('GeneralLedgerService', () => {
	let service: GeneralLedgerService
	let fakeRepo: GeneralLedgerRepo

	beforeEach(() => {
		fakeRepo = {
			postEntry: spyOn(),
			getEntryBySource: spyOn(),
		} as any

		service = new GeneralLedgerService(fakeRepo)
	})

	describe('postEntry', () => {
		it('should post balanced journal entry successfully', async () => {
			const input: JournalEntryInput = {
				date: new Date(),
				reference: 'TEST-001',
				sourceType: 'test',
				sourceId: 1,
				note: 'Test journal entry',
				items: [
					{
						accountId: 1001,
						debit: '1000',
						credit: '0',
					},
					{
						accountId: 2001,
						debit: '0',
						credit: '1000',
					},
				],
			}

			const actorId = 1
			const mockResult = { id: 1, ...input }

			spyOn(fakeRepo, 'postEntry').mockResolvedValue(mockResult)

			const result = await service.postEntry(input, actorId)

			expect(fakeRepo.postEntry).toHaveBeenCalledWith(input, actorId)
			expect(result).toEqual(mockResult)
		})

		it('should post journal entry with multiple items', async () => {
			const input: JournalEntryInput = {
				date: new Date(),
				reference: 'TEST-002',
				sourceType: 'test',
				sourceId: 2,
				note: 'Multi-item journal entry',
				items: [
					{
						accountId: 1001,
						debit: '500',
						credit: '0',
					},
					{
						accountId: 1002,
						debit: '500',
						credit: '0',
					},
					{
						accountId: 2001,
						debit: '0',
						credit: '1000',
					},
				],
			}

			const actorId = 1
			const mockResult = { id: 2, ...input }

			spyOn(fakeRepo, 'postEntry').mockResolvedValue(mockResult)

			const result = await service.postEntry(input, actorId)

			expect(fakeRepo.postEntry).toHaveBeenCalledWith(input, actorId)
			expect(result).toEqual(mockResult)
		})

		it('should throw error when journal entry is not balanced - debit greater', async () => {
			const input: JournalEntryInput = {
				date: new Date(),
				reference: 'UNBALANCED-001',
				sourceType: 'test',
				sourceId: 3,
				note: 'Unbalanced journal entry',
				items: [
					{
						accountId: 1001,
						debit: '1500',
						credit: '0',
					},
					{
						accountId: 2001,
						debit: '0',
						credit: '1000',
					},
				],
			}

			const actorId = 1

			await expect(service.postEntry(input, actorId)).rejects.toThrow(
				'Journal entry must be balanced. Total Debit: 1500, Total Credit: 1000',
			)

			expect(fakeRepo.postEntry).not.toHaveBeenCalled()
		})

		it('should throw error when journal entry is not balanced - credit greater', async () => {
			const input: JournalEntryInput = {
				date: new Date(),
				reference: 'UNBALANCED-002',
				sourceType: 'test',
				sourceId: 4,
				note: 'Unbalanced journal entry',
				items: [
					{
						accountId: 1001,
						debit: '1000',
						credit: '0',
					},
					{
						accountId: 2001,
						debit: '0',
						credit: '1500',
					},
				],
			}

			const actorId = 1

			await expect(service.postEntry(input, actorId)).rejects.toThrow(
				'Journal entry must be balanced. Total Debit: 1000, Total Credit: 1500',
			)

			expect(fakeRepo.postEntry).not.toHaveBeenCalled()
		})

		it('should handle zero-value balanced entries', async () => {
			const input: JournalEntryInput = {
				date: new Date(),
				reference: 'ZERO-001',
				sourceType: 'test',
				sourceId: 5,
				note: 'Zero value journal entry',
				items: [
					{
						accountId: 1001,
						debit: '0',
						credit: '0',
					},
					{
						accountId: 2001,
						debit: '0',
						credit: '0',
					},
				],
			}

			const actorId = 1
			const mockResult = { id: 3, ...input }

			spyOn(fakeRepo, 'postEntry').mockResolvedValue(mockResult)

			const result = await service.postEntry(input, actorId)

			expect(fakeRepo.postEntry).toHaveBeenCalledWith(input, actorId)
			expect(result).toEqual(mockResult)
		})

		it('should handle decimal values correctly', async () => {
			const input: JournalEntryInput = {
				date: new Date(),
				reference: 'DECIMAL-001',
				sourceType: 'test',
				sourceId: 6,
				note: 'Decimal values journal entry',
				items: [
					{
						accountId: 1001,
						debit: '1000.50',
						credit: '0',
					},
					{
						accountId: 2001,
						debit: '0',
						credit: '1000.50',
					},
				],
			}

			const actorId = 1
			const mockResult = { id: 4, ...input }

			spyOn(fakeRepo, 'postEntry').mockResolvedValue(mockResult)

			const result = await service.postEntry(input, actorId)

			expect(fakeRepo.postEntry).toHaveBeenCalledWith(input, actorId)
			expect(result).toEqual(mockResult)
		})
	})

	describe('getEntryBySource', () => {
		it('should return journal entry by source', async () => {
			const sourceType = 'expenditure'
			const sourceId = 1
			const mockEntry = {
				id: 1,
				date: new Date(),
				reference: 'EXP-000001',
				sourceType: 'expenditure',
				sourceId: 1,
				note: 'Test expenditure',
				items: [],
			}

			spyOn(fakeRepo, 'getEntryBySource').mockResolvedValue(mockEntry)

			const result = await service.getEntryBySource(sourceType, sourceId)

			expect(fakeRepo.getEntryBySource).toHaveBeenCalledWith(sourceType, sourceId)
			expect(result).toEqual(mockEntry)
		})

		it('should return undefined when entry not found by source', async () => {
			const sourceType = 'expenditure'
			const sourceId = 999

			spyOn(fakeRepo, 'getEntryBySource').mockResolvedValue(undefined)

			const result = await service.getEntryBySource(sourceType, sourceId)

			expect(result).toBeUndefined()
		})
	})
})
