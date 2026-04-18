import { record } from '@elysiajs/opentelemetry'
import { and, eq, isNull } from 'drizzle-orm'

import { stampCreate, stampUpdate, takeFirstOrThrow } from '@/core/database'
import { ConflictError } from '@/core/http/errors'

import { db } from '@/db'
import {
	employeesTable,
	payrollAdjustmentsTable,
	payrollBatchesTable,
	payrollItemsTable,
} from '@/db/schema'

import type { AccountService, GeneralLedgerService } from '../../finance/service'
import type {
	PayrollBatchCreateDto,
	PayrollBatchDto,
	PayrollAdjustmentCreateDto,
	PayrollAdjustmentDto,
} from '../dto/payroll.dto'
import type { InferSelectModel } from 'drizzle-orm'

type PayrollBatch = InferSelectModel<typeof payrollBatchesTable>

export class PayrollService {
	constructor(
		private readonly accountSvc: AccountService,
		private readonly journalSvc: GeneralLedgerService,
	) {}

	async handleBatchCreate(data: PayrollBatchCreateDto, actorId: number): Promise<PayrollBatchDto> {
		return record('PayrollService.handleBatchCreate', async () => {
			const existing = await db
				.select()
				.from(payrollBatchesTable)
				.where(
					and(
						eq(payrollBatchesTable.periodMonth, data.periodMonth),
						eq(payrollBatchesTable.periodYear, data.periodYear),
						isNull(payrollBatchesTable.deletedAt),
					),
				)

			if (existing.length > 0) {
				throw new ConflictError(
					`Payroll batch for ${data.periodMonth}/${data.periodYear} already exists`,
				)
			}

			return db.transaction(async (tx) => {
				const metadata = stampCreate(actorId)

				const [batch] = await tx
					.insert(payrollBatchesTable)
					.values({
						name: data.name,
						periodMonth: data.periodMonth,
						periodYear: data.periodYear,
						status: 'draft',
						totalAmount: '0',
						note: data.note ?? null,
						...metadata,
					})
					.returning()

				if (!batch) throw new Error('Failed to create payroll batch')

				const employees = await tx
					.select()
					.from(employeesTable)
					.where(isNull(employeesTable.deletedAt))

				let totalAmount = 0
				for (const emp of employees) {
					totalAmount += Number(emp.baseSalary)
					await tx.insert(payrollItemsTable).values({
						batchId: batch.id,
						employeeId: emp.id,
						baseSalary: emp.baseSalary,
						adjustmentsAmount: '0',
						serviceChargeAmount: '0',
						totalAmount: emp.baseSalary,
						...metadata,
					})
				}

				const [finalBatch] = await tx
					.update(payrollBatchesTable)
					.set({ totalAmount: totalAmount.toString() })
					.where(eq(payrollBatchesTable.id, batch.id))
					.returning()

				return finalBatch as unknown as PayrollBatchDto
			})
		})
	}

	async handleAddAdjustment(
		data: PayrollAdjustmentCreateDto,
		actorId: number,
	): Promise<PayrollAdjustmentDto> {
		return record('PayrollService.handleAddAdjustment', async () => {
			return db.transaction(async (tx) => {
				const metadata = stampCreate(actorId)

				const [adjustment] = await tx
					.insert(payrollAdjustmentsTable)
					.values({
						payrollItemId: data.payrollItemId,
						type: data.type,
						amount: data.amount.toString(),
						reason: data.reason,
						...metadata,
					})
					.returning()

				if (!adjustment) throw new Error('Failed to create payroll adjustment')

				const itemResult = await tx
					.select()
					.from(payrollItemsTable)
					.where(eq(payrollItemsTable.id, data.payrollItemId))

				const item = takeFirstOrThrow(
					itemResult,
					'Payroll item not found',
					'PAYROLL_ITEM_NOT_FOUND',
				)

				const currentAdjustments = Number(item.adjustmentsAmount)
				const adjustmentAmount =
					data.type === 'addition' ? Number(data.amount) : -Number(data.amount)
				const newAdjustments = currentAdjustments + adjustmentAmount
				const newTotal = Number(item.baseSalary) + newAdjustments + Number(item.serviceChargeAmount)

				await tx
					.update(payrollItemsTable)
					.set({
						adjustmentsAmount: newAdjustments.toString(),
						totalAmount: newTotal.toString(),
						...stampUpdate(actorId),
					})
					.where(eq(payrollItemsTable.id, item.id))

				const batchResult = await tx
					.select()
					.from(payrollBatchesTable)
					.where(eq(payrollBatchesTable.id, item.batchId))

				const batch = takeFirstOrThrow(
					batchResult,
					'Payroll batch not found',
					'PAYROLL_BATCH_NOT_FOUND',
				)

				const newBatchTotal = Number(batch.totalAmount) + adjustmentAmount
				await tx
					.update(payrollBatchesTable)
					.set({ totalAmount: newBatchTotal.toString(), ...stampUpdate(actorId) })
					.where(eq(payrollBatchesTable.id, batch.id))

				return adjustment as unknown as PayrollAdjustmentDto
			})
		})
	}

	async handleFinalizeBatch(batchId: number, actorId: number): Promise<PayrollBatchDto> {
		return record('PayrollService.handleFinalizeBatch', async () => {
			return db.transaction(async (tx) => {
				const batchResult = await tx
					.select()
					.from(payrollBatchesTable)
					.where(eq(payrollBatchesTable.id, batchId))

				const batch = takeFirstOrThrow(
					batchResult,
					'Payroll batch not found',
					'PAYROLL_BATCH_NOT_FOUND',
				)

				if (batch.status !== 'draft') {
					throw new ConflictError('Only draft batches can be finalized')
				}

				const [finalizedBatch] = await tx
					.update(payrollBatchesTable)
					.set({ status: 'approved', ...stampUpdate(actorId) })
					.where(eq(payrollBatchesTable.id, batchId))
					.returning()

				if (!finalizedBatch) throw new Error('Failed to finalize batch')

				// Automated General Ledger Posting (FIN-02)
				await this.postPayrollToGL(finalizedBatch as PayrollBatch, actorId)

				return finalizedBatch as unknown as PayrollBatchDto
			})
		})
	}

	private async postPayrollToGL(batch: PayrollBatch, actorId: number) {
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
					{ accountId: expenseAcc.id, debit: batch.totalAmount, credit: '0' },
					{ accountId: payableAcc.id, debit: '0', credit: batch.totalAmount },
				],
			},
			actorId,
		)
	}
}
