/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-redundant-type-constituents */
import { record } from '@elysiajs/opentelemetry'
import { and, eq, isNull, sql } from 'drizzle-orm'

import {
	employeesTable,
	payrollAdjustmentsTable,
	payrollBatchesTable,
	payrollItemsTable,
} from '@/db/schema'

import { takeFirstOrThrow, type DbClient } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'

import {
	PayrollBatchCreateDto,
	PayrollBatchDto,
	PayrollBatchFilterDto,
	PayrollAdjustmentCreateDto,
	PayrollAdjustmentDto,
} from './payroll.contract'
import { PayrollError } from './payroll.internal'

export interface IPayrollRepo {
	readonly db: DbClient
	findBatchByPeriod(month: number, year: number): Promise<any | undefined>
	getBatchById(id: number): Promise<any | undefined>
	getPayrollItemById(id: number): Promise<any | undefined>
	listBatches(filter: PayrollBatchFilterDto): Promise<{ data: any[]; count: number }>
	createBatch(data: PayrollBatchCreateDto, actorId: number): Promise<PayrollBatchDto>
	addAdjustment(
		data: PayrollAdjustmentCreateDto,
		actorId: number,
	): Promise<PayrollAdjustmentDto>
	finalizeBatch(batchId: number, actorId: number): Promise<PayrollBatchDto>
}

export class PayrollRepo implements IPayrollRepo {
	constructor(readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	async findBatchByPeriod(month: number, year: number): Promise<any | undefined> {
		const [existing] = await this.db
			.select()
			.from(payrollBatchesTable)
			.where(
				and(
					eq(payrollBatchesTable.periodMonth, month),
					eq(payrollBatchesTable.periodYear, year),
					isNull(payrollBatchesTable.deletedAt),
				),
			)
		return existing
	}

	async getBatchById(id: number): Promise<any | undefined> {
		const [result] = await this.db
			.select()
			.from(payrollBatchesTable)
			.where(and(eq(payrollBatchesTable.id, id), isNull(payrollBatchesTable.deletedAt)))
		return result
	}

	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	async getPayrollItemById(id: number): Promise<any | undefined> {
		const [result] = await this.db
			.select()
			.from(payrollItemsTable)
			.where(eq(payrollItemsTable.id, id))
		return result
	}

	async listBatches(filter: PayrollBatchFilterDto) {
		const { page, limit, q, status } = filter
		const offset = (page - 1) * limit

		const conditions = [isNull(payrollBatchesTable.deletedAt)]
		if (status) conditions.push(eq(payrollBatchesTable.status, status))
		if (q) conditions.push(sql`LOWER(${payrollBatchesTable.name}) LIKE ${`%${q.toLowerCase()}%`}`)

		const whereClause = and(...conditions)

		const [data, count] = await Promise.all([
			this.db
				.select()
				.from(payrollBatchesTable)
				.where(whereClause)
				.orderBy(
					sql`${payrollBatchesTable.periodYear} DESC, ${payrollBatchesTable.periodMonth} DESC`,
				)
				.limit(limit)
				.offset(offset),
			this.db
				.select({ count: sql<number>`cast(count(*) as int)` })
				.from(payrollBatchesTable)
				.where(whereClause),
		])

		return { data, count: count[0]?.count ?? 0 }
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async createBatch(data: PayrollBatchCreateDto, actorId: number): Promise<PayrollBatchDto> {
		return record('PayrollRepo.createBatch', async () => {
			return this.db.transaction(async (tx) => {
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

				if (!batch) throw PayrollError.createBatchFailed()

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

	async addAdjustment(
		data: PayrollAdjustmentCreateDto,
		actorId: number,
	): Promise<PayrollAdjustmentDto> {
		return record('PayrollRepo.addAdjustment', async () => {
			const result = await this.db.transaction(async (tx) => {
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

				if (!adjustment) throw PayrollError.createAdjustmentFailed()

				const itemResult = await tx
					.select()
					.from(payrollItemsTable)
					.where(eq(payrollItemsTable.id, data.payrollItemId))

				const item = takeFirstOrThrow(itemResult, 'Payroll item not found')

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

				const batch = takeFirstOrThrow(batchResult, 'Payroll batch not found')

				const newBatchTotal = Number(batch.totalAmount) + adjustmentAmount
				await tx
					.update(payrollBatchesTable)
					.set({ totalAmount: newBatchTotal.toString(), ...stampUpdate(actorId) })
					.where(eq(payrollBatchesTable.id, batch.id))

				return adjustment as unknown as PayrollAdjustmentDto
			})
			return result
		})
	}

	async finalizeBatch(batchId: number, actorId: number): Promise<PayrollBatchDto> {
		return record('PayrollRepo.finalizeBatch', async () => {
			const [result] = await this.db
				.update(payrollBatchesTable)
				.set({ status: 'approved', ...stampUpdate(actorId) })
				.where(eq(payrollBatchesTable.id, batchId))
				.returning()

			if (!result) throw PayrollError.finalizeBatchFailed()
			return result as unknown as PayrollBatchDto
		})
	}
}
