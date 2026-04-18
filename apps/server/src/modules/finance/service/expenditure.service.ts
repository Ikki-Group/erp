import { record } from '@elysiajs/opentelemetry'
import { and, desc, eq, isNull } from 'drizzle-orm'

import { stampCreate } from '@/core/database'

import { db } from '@/db'
import { expendituresTable } from '@/db/schema/finance'

import type { ExpenditureCreateDto, ExpenditureFilterDto } from '../dto/expenditure.dto'
import { GeneralLedgerService } from './general-ledger.service'

export class ExpenditureService {
	constructor(private readonly journal: GeneralLedgerService) {}

	async createExpenditure(input: ExpenditureCreateDto, actorId: number) {
		return record('ExpenditureService.createExpenditure', async () => {
			return db.transaction(async (tx) => {
				const metadata = stampCreate(actorId)

				// 1. Insert Expenditure Record
				const [expenditure] = await tx
					.insert(expendituresTable)
					.values({
						...input,
						...metadata,
					})
					.returning()

				if (!expenditure) throw new Error('Failed to create expenditure record')

				// 2. Prepare Journal Items
				// Standard: Debit the Target (Expense/Asset)
				const items = [
					{
						accountId: input.targetAccountId,
						debit: input.amount,
						credit: '0',
					},
				]

				if (input.isInstallment && input.liabilityAccountId) {
					// Installment Logic: Target (DR) vs Source (CR - Paid) + Liability (CR - Debt)
					// For simplicity in MVP, we assume it's either fully paid or fully debt if not specified.
					// But let's allow a split if we add a 'paidAmount' later.
					// For now: FULL amount is credited to Liability if isInstallment is true and status is not PAID?
					// Let's go with:
					// Status PAID + isInstallment = Source Account (CR)
					// Status PENDING + isInstallment = Liability Account (CR)

					const creditAccountId =
						input.status === 'PAID' ? input.sourceAccountId : input.liabilityAccountId
					items.push({
						accountId: creditAccountId,
						debit: '0',
						credit: input.amount,
					})
				} else {
					// Normal Logic: Target (DR) vs Source (CR)
					items.push({
						accountId: input.sourceAccountId,
						debit: '0',
						credit: input.amount,
					})
				}

				// 3. Post to General Ledger
				await this.journal.postEntry(
					{
						date: input.date,
						reference: `EXP-${expenditure.id.toString().padStart(6, '0')}`,
						sourceType: 'expenditure',
						sourceId: expenditure.id,
						note: input.description ?? input.title,
						items,
					},
					actorId,
				)

				return expenditure
			})
		})
	}

	async listExpenditures(filter: ExpenditureFilterDto) {
		return record('ExpenditureService.listExpenditures', async () => {
			const { page = 1, limit = 20, search, type, status, locationId } = filter
			const offset = (page - 1) * limit

			const where = and(
				isNull(expendituresTable.deletedAt),
				type ? eq(expendituresTable.type, type) : undefined,
				status ? eq(expendituresTable.status, status) : undefined,
				locationId ? eq(expendituresTable.locationId, locationId) : undefined,
			)

			// search logic could be added here if needed

			const data = await db
				.select()
				.from(expendituresTable)
				.where(where)
				.limit(limit)
				.offset(offset)
				.orderBy(desc(expendituresTable.date))

			return data
		})
	}
}
