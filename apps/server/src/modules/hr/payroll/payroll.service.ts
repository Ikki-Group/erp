import { record } from '@elysiajs/opentelemetry'

import { ConflictError, NotFoundError } from '@/core/http/errors'

import { db } from '@/db'

import type { AccountService, GeneralLedgerService } from '@/modules/finance'

import type {
	PayrollBatchCreateDto,
	PayrollBatchDto,
	PayrollAdjustmentCreateDto,
	PayrollAdjustmentDto,
} from './payroll.dto'
import { PayrollRepo } from './payroll.repo'

export class PayrollService {
	constructor(
		private readonly accountSvc: AccountService,
		private readonly journalSvc: GeneralLedgerService,
		private readonly repo = new PayrollRepo(),
	) {}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleBatchCreate(data: PayrollBatchCreateDto, actorId: number): Promise<PayrollBatchDto> {
		return record('PayrollService.handleBatchCreate', async () => {
			const existing = await this.repo.findBatchByPeriod(data.periodMonth, data.periodYear)
			if (existing) {
				throw new ConflictError(
					`Payroll batch for ${data.periodMonth}/${data.periodYear} already exists`,
				)
			}

			return this.repo.createBatch(data, actorId)
		})
	}

	async handleAddAdjustment(
		data: PayrollAdjustmentCreateDto,
		actorId: number,
	): Promise<PayrollAdjustmentDto> {
		return record('PayrollService.handleAddAdjustment', async () => {
			return this.repo.addAdjustment(data, actorId)
		})
	}

	async handleFinalizeBatch(batchId: number, actorId: number): Promise<PayrollBatchDto> {
		return record('PayrollService.handleFinalizeBatch', async () => {
			return db.transaction(async () => {
				const batch = await this.repo.getBatchById(batchId)
				if (!batch) throw new NotFoundError('Payroll batch not found', 'PAYROLL_BATCH_NOT_FOUND')

				if (batch.status !== 'draft') {
					throw new ConflictError('Only draft batches can be finalized')
				}

				const finalizedBatch = await this.repo.finalizeBatch(batchId, actorId)

				await this.postPayrollToGL(finalizedBatch, actorId)

				return finalizedBatch
			})
		})
	}

	/* --------------------------------- PRIVATE -------------------------------- */

	private async postPayrollToGL(batch: PayrollBatchDto, actorId: number) {
		const expenseAcc = await this.accountSvc.findByCode('5201')
		const payableAcc = await this.accountSvc.findByCode('2102')

		if (!expenseAcc || !payableAcc) {
			console.warn('Accounting accounts for payroll not found, skipping GL posting')
			return
		}

		await this.journalSvc.postEntry(
			{
				date: new Date(),
				reference: `PAYROLL-${batch.periodYear}-${batch.periodMonth}`,
				sourceType: 'payroll',
				sourceId: batch.id,
				note: `Automated posting from Payroll Finalization (Batch: ${batch.name})`,
				items: [
					{ accountId: expenseAcc.id, debit: batch.totalAmount.toString(), credit: '0' },
					{ accountId: payableAcc.id, debit: '0', credit: batch.totalAmount.toString() },
				],
			},
			actorId,
		)
	}
}
