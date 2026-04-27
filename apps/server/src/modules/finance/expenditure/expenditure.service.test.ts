import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExpenditureService } from './expenditure.service'
import { ExpenditureRepo } from './expenditure.repo'
import { GeneralLedgerService } from '../general-ledger/general-ledger.service'
import * as dto from './expenditure.dto'

// Mock database transaction
vi.mock('@/db', () => ({
	db: {
		transaction: vi.fn(),
	},
}))

import { db } from '@/db'

describe('ExpenditureService', () => {
	let service: ExpenditureService
	let fakeRepo: ExpenditureRepo
	let fakeJournalService: GeneralLedgerService

	beforeEach(() => {
		fakeRepo = {
			create: vi.fn(),
			getListPaginated: vi.fn(),
		} as any

		fakeJournalService = {
			postEntry: vi.fn(),
		} as any

		service = new ExpenditureService(fakeJournalService, fakeRepo)
	})

	describe('createExpenditure', () => {
		it('should create expenditure with standard journal entry', async () => {
			const input: dto.ExpenditureCreateDto = {
				title: 'Office Supplies',
				description: 'Buying office supplies',
				amount: 1000,
				date: new Date(),
				sourceAccountId: 1001,
				targetAccountId: 5001,
				isInstallment: false,
			}

			const actorId = 1
			const mockExpenditure = {
				id: 1,
				...input,
				createdAt: new Date(),
				createdBy: actorId,
			}

			const mockTransaction = vi.fn().mockImplementation(async (callback) => {
				return await callback()
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			vi.spyOn(fakeRepo, 'create').mockResolvedValue(mockExpenditure)
			vi.spyOn(fakeJournalService, 'postEntry').mockResolvedValue(undefined)

			const result = await service.createExpenditure(input, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(input, actorId)
			expect(fakeJournalService.postEntry).toHaveBeenCalledWith(
				{
					date: input.date,
					reference: 'EXP-000001',
					sourceType: 'expenditure',
					sourceId: 1,
					note: 'Buying office supplies',
					items: [
						{
							accountId: 5001,
							debit: '1000',
							credit: '0',
						},
						{
							accountId: 1001,
							debit: '0',
							credit: '1000',
						},
					],
				},
				actorId
			)
			expect(result).toEqual(mockExpenditure)
		})

		it('should create expenditure with installment journal entry when paid', async () => {
			const input: dto.ExpenditureCreateDto = {
				title: 'Equipment Purchase',
				description: 'Buying equipment on installment',
				amount: 5000,
				date: new Date(),
				sourceAccountId: 1001,
				targetAccountId: 5001,
				isInstallment: true,
				liabilityAccountId: 2001,
				status: 'PAID',
			}

			const actorId = 1
			const mockExpenditure = {
				id: 2,
				...input,
				createdAt: new Date(),
				createdBy: actorId,
			}

			const mockTransaction = vi.fn().mockImplementation(async (callback) => {
				return await callback()
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			vi.spyOn(fakeRepo, 'create').mockResolvedValue(mockExpenditure)
			vi.spyOn(fakeJournalService, 'postEntry').mockResolvedValue(undefined)

			const result = await service.createExpenditure(input, actorId)

			expect(fakeJournalService.postEntry).toHaveBeenCalledWith(
				{
					date: input.date,
					reference: 'EXP-000002',
					sourceType: 'expenditure',
					sourceId: 2,
					note: 'Buying equipment on installment',
					items: [
						{
							accountId: 5001,
							debit: '5000',
							credit: '0',
						},
						{
							accountId: 1001,
							debit: '0',
							credit: '5000',
						},
					],
				},
				actorId
			)
			expect(result).toEqual(mockExpenditure)
		})

		it('should create expenditure with installment journal entry when unpaid', async () => {
			const input: dto.ExpenditureCreateDto = {
				title: 'Equipment Purchase',
				description: 'Buying equipment on installment',
				amount: 5000,
				date: new Date(),
				sourceAccountId: 1001,
				targetAccountId: 5001,
				isInstallment: true,
				liabilityAccountId: 2001,
				status: 'PENDING',
			}

			const actorId = 1
			const mockExpenditure = {
				id: 3,
				...input,
				createdAt: new Date(),
				createdBy: actorId,
			}

			const mockTransaction = vi.fn().mockImplementation(async (callback) => {
				return await callback()
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			vi.spyOn(fakeRepo, 'create').mockResolvedValue(mockExpenditure)
			vi.spyOn(fakeJournalService, 'postEntry').mockResolvedValue(undefined)

			const result = await service.createExpenditure(input, actorId)

			expect(fakeJournalService.postEntry).toHaveBeenCalledWith(
				{
					date: input.date,
					reference: 'EXP-000003',
					sourceType: 'expenditure',
					sourceId: 3,
					note: 'Buying equipment on installment',
					items: [
						{
							accountId: 5001,
							debit: '5000',
							credit: '0',
						},
						{
							accountId: 2001,
							debit: '0',
							credit: '5000',
						},
					],
				},
				actorId
			)
			expect(result).toEqual(mockExpenditure)
		})

		it('should use title as note when description is not provided', async () => {
			const input: dto.ExpenditureCreateDto = {
				title: 'Office Supplies',
				description: undefined,
				amount: 1000,
				date: new Date(),
				sourceAccountId: 1001,
				targetAccountId: 5001,
				isInstallment: false,
			}

			const actorId = 1
			const mockExpenditure = {
				id: 4,
				...input,
				createdAt: new Date(),
				createdBy: actorId,
			}

			const mockTransaction = vi.fn().mockImplementation(async (callback) => {
				return await callback()
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			vi.spyOn(fakeRepo, 'create').mockResolvedValue(mockExpenditure)
			vi.spyOn(fakeJournalService, 'postEntry').mockResolvedValue(undefined)

			await service.createExpenditure(input, actorId)

			expect(fakeJournalService.postEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					note: 'Office Supplies',
				}),
				actorId
			)
		})
	})

	describe('listExpenditures', () => {
		it('should return paginated list of expenditures', async () => {
			const filter: dto.ExpenditureFilterDto = { page: 1, limit: 10 }
			const mockPaginatedResult = {
				data: [
					{
						id: 1,
						title: 'Office Supplies',
						amount: 1000,
						date: new Date(),
						status: 'PAID',
					},
				],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			vi.spyOn(fakeRepo, 'getListPaginated').mockResolvedValue(mockPaginatedResult)

			const result = await service.listExpenditures(filter)

			expect(fakeRepo.getListPaginated).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockPaginatedResult)
		})
	})
})
