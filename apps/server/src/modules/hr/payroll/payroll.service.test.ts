import { ConflictError, NotFoundError } from '@/core/http/errors'

import { AccountService } from '@/modules/finance/account/account.service'
import { GeneralLedgerService } from '@/modules/finance/general-ledger/general-ledger.service'

import * as dto from './payroll.dto'
import { PayrollRepo } from './payroll.repo'
import { PayrollService } from './payroll.service'
import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

// Mock database transaction
vi.mock('@/db', () => ({
	db: {
		transaction: spyOn(),
	},
}))

import { db } from '@/db'

describe('PayrollService', () => {
	let service: PayrollService
	let fakeRepo: PayrollRepo
	let fakeAccountService: AccountService
	let fakeJournalService: GeneralLedgerService

	beforeEach(() => {
		fakeRepo = {
			findBatchByPeriod: spyOn(),
			createBatch: spyOn(),
			addAdjustment: spyOn(),
			getBatchById: spyOn(),
			finalizeBatch: spyOn(),
		} as any

		fakeAccountService = {
			findByCode: spyOn(),
		} as any

		fakeJournalService = {
			postEntry: spyOn(),
		} as any

		service = new PayrollService(fakeAccountService, fakeJournalService, fakeRepo)
	})

	describe('handleBatchCreate', () => {
		it('should create payroll batch successfully', async () => {
			const batchData: dto.PayrollBatchCreateDto = {
				name: 'January 2024 Payroll',
				periodMonth: 1,
				periodYear: 2024,
				description: 'Monthly payroll for January 2024',
			}

			const actorId = 1
			const mockBatch: dto.PayrollBatchDto = {
				id: 1,
				...batchData,
				status: 'draft',
				totalAmount: 0,
				employeeCount: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'findBatchByPeriod').mockResolvedValue(null)
			spyOn(fakeRepo, 'createBatch').mockResolvedValue(mockBatch)

			const result = await service.handleBatchCreate(batchData, actorId)

			expect(fakeRepo.findBatchByPeriod).toHaveBeenCalledWith(1, 2024)
			expect(fakeRepo.createBatch).toHaveBeenCalledWith(batchData, actorId)
			expect(result).toEqual(mockBatch)
		})

		it('should throw ConflictError when batch already exists for period', async () => {
			const batchData: dto.PayrollBatchCreateDto = {
				name: 'January 2024 Payroll',
				periodMonth: 1,
				periodYear: 2024,
				description: 'Monthly payroll for January 2024',
			}

			const actorId = 1
			const existingBatch: dto.PayrollBatchDto = {
				id: 1,
				...batchData,
				status: 'draft',
				totalAmount: 0,
				employeeCount: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'findBatchByPeriod').mockResolvedValue(existingBatch)

			await expect(service.handleBatchCreate(batchData, actorId)).rejects.toThrow(
				new ConflictError('Payroll batch for 1/2024 already exists'),
			)

			expect(fakeRepo.createBatch).not.toHaveBeenCalled()
		})
	})

	describe('handleAddAdjustment', () => {
		it('should add adjustment successfully', async () => {
			const adjustmentData: dto.PayrollAdjustmentCreateDto = {
				batchId: 1,
				employeeId: 1,
				adjustmentType: 'bonus',
				amount: 500,
				description: 'Performance bonus',
			}

			const actorId = 1
			const mockAdjustment: dto.PayrollAdjustmentDto = {
				id: 1,
				...adjustmentData,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'addAdjustment').mockResolvedValue(mockAdjustment)

			const result = await service.handleAddAdjustment(adjustmentData, actorId)

			expect(fakeRepo.addAdjustment).toHaveBeenCalledWith(adjustmentData, actorId)
			expect(result).toEqual(mockAdjustment)
		})
	})

	describe('handleFinalizeBatch', () => {
		it('should finalize batch and post to GL successfully', async () => {
			const batchId = 1
			const actorId = 1

			const mockBatch: dto.PayrollBatchDto = {
				id: 1,
				name: 'January 2024 Payroll',
				periodMonth: 1,
				periodYear: 2024,
				status: 'draft',
				totalAmount: 50000,
				employeeCount: 10,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const finalizedBatch: dto.PayrollBatchDto = {
				...mockBatch,
				status: 'finalized',
				updatedAt: new Date(),
			}

			const expenseAccount = { id: 1001, code: '5201', name: 'Payroll Expense' }
			const payableAccount = { id: 2001, code: '2102', name: 'Payroll Payable' }

			const mockTransaction = spyOn().mockImplementation(async (callback) => {
				return await callback()
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			spyOn(fakeRepo, 'getBatchById').mockResolvedValue(mockBatch)
			spyOn(fakeRepo, 'finalizeBatch').mockResolvedValue(finalizedBatch)
			spyOn(fakeAccountService, 'findByCode')
				.mockResolvedValueOnce(expenseAccount as any)
				.mockResolvedValueOnce(payableAccount as any)
			spyOn(fakeJournalService, 'postEntry').mockResolvedValue(undefined)

			const result = await service.handleFinalizeBatch(batchId, actorId)

			expect(fakeRepo.getBatchById).toHaveBeenCalledWith(batchId)
			expect(fakeRepo.finalizeBatch).toHaveBeenCalledWith(batchId, actorId)
			expect(fakeAccountService.findByCode).toHaveBeenCalledWith('5201')
			expect(fakeAccountService.findByCode).toHaveBeenCalledWith('2102')
			expect(fakeJournalService.postEntry).toHaveBeenCalledWith(
				{
					date: expect.any(Date),
					reference: 'PAYROLL-2024-1',
					sourceType: 'payroll',
					sourceId: 1,
					note: 'Automated posting from Payroll Finalization (Batch: January 2024 Payroll)',
					items: [
						{ accountId: 1001, debit: '50000', credit: '0' },
						{ accountId: 2001, debit: '0', credit: '50000' },
					],
				},
				actorId,
			)
			expect(result).toEqual(finalizedBatch)
		})

		it('should throw NotFoundError when batch not found', async () => {
			const batchId = 999
			const actorId = 1

			const mockTransaction = spyOn().mockImplementation(async (callback) => {
				return await callback()
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			spyOn(fakeRepo, 'getBatchById').mockResolvedValue(undefined)

			await expect(service.handleFinalizeBatch(batchId, actorId)).rejects.toThrow(
				new NotFoundError('Payroll batch not found', 'PAYROLL_BATCH_NOT_FOUND'),
			)

			expect(fakeRepo.finalizeBatch).not.toHaveBeenCalled()
			expect(fakeJournalService.postEntry).not.toHaveBeenCalled()
		})

		it('should throw ConflictError when batch is not in draft status', async () => {
			const batchId = 1
			const actorId = 1

			const mockBatch: dto.PayrollBatchDto = {
				id: 1,
				name: 'January 2024 Payroll',
				periodMonth: 1,
				periodYear: 2024,
				status: 'finalized',
				totalAmount: 50000,
				employeeCount: 10,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockTransaction = spyOn().mockImplementation(async (callback) => {
				return await callback()
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			spyOn(fakeRepo, 'getBatchById').mockResolvedValue(mockBatch)

			await expect(service.handleFinalizeBatch(batchId, actorId)).rejects.toThrow(
				new ConflictError('Only draft batches can be finalized'),
			)

			expect(fakeRepo.finalizeBatch).not.toHaveBeenCalled()
			expect(fakeJournalService.postEntry).not.toHaveBeenCalled()
		})

		it('should skip GL posting when accounts not found', async () => {
			const batchId = 1
			const actorId = 1

			const mockBatch: dto.PayrollBatchDto = {
				id: 1,
				name: 'January 2024 Payroll',
				periodMonth: 1,
				periodYear: 2024,
				status: 'draft',
				totalAmount: 50000,
				employeeCount: 10,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const finalizedBatch: dto.PayrollBatchDto = {
				...mockBatch,
				status: 'finalized',
				updatedAt: new Date(),
			}

			const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

			const mockTransaction = spyOn().mockImplementation(async (callback) => {
				return await callback()
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			spyOn(fakeRepo, 'getBatchById').mockResolvedValue(mockBatch)
			spyOn(fakeRepo, 'finalizeBatch').mockResolvedValue(finalizedBatch)
			spyOn(fakeAccountService, 'findByCode')
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce({ id: 2001, code: '2102' } as any)

			const result = await service.handleFinalizeBatch(batchId, actorId)

			expect(consoleSpy).toHaveBeenCalledWith(
				'Accounting accounts for payroll not found, skipping GL posting',
			)
			expect(fakeJournalService.postEntry).not.toHaveBeenCalled()
			expect(result).toEqual(finalizedBatch)

			consoleSpy.mockRestore()
		})
	})
})
