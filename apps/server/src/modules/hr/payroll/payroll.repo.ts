/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-redundant-type-constituents */
import { record } from '@elysiajs/opentelemetry'
import { and, eq, isNull } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import { stampCreate, stampUpdate, takeFirstOrThrow, type DbClient } from '@/core/database'
import { logger } from '@/core/logger'

import {
	employeesTable,
	payrollAdjustmentsTable,
	payrollBatchesTable,
	payrollItemsTable,
} from '@/db/schema'

import type {
	PayrollBatchCreateDto,
	PayrollBatchDto,
	PayrollAdjustmentCreateDto,
	PayrollAdjustmentDto,
} from './payroll.dto'

const PAYROLL_CACHE_NAMESPACE = 'hr.payroll'

export class PayrollRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(PAYROLL_CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await this.cache.deleteMany({ keys })
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'PayrollRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

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

	async getPayrollItemById(id: number): Promise<any | undefined> {
		const [result] = await this.db
			.select()
			.from(payrollItemsTable)
			.where(eq(payrollItemsTable.id, id))
		return result
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

				if (!adjustment) throw new Error('Failed to create payroll adjustment')

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
			this.#clearCacheAsync()
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

			if (!result) throw new Error('Failed to finalize batch')
			this.#clearCacheAsync(batchId)
			return result as unknown as PayrollBatchDto
		})
	}
}
