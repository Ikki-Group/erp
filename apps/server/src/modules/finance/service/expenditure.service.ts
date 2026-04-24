import { record } from '@elysiajs/opentelemetry'
import { and, desc, eq, isNull, or } from 'drizzle-orm'

import { bento } from '@/core/cache'
import { searchFilter, stampCreate } from '@/core/database'

const cache = bento.namespace('finance.expenditure')

import { db } from '@/db'
import { expendituresTable } from '@/db/schema/finance'

import type { ExpenditureCreateDto, ExpenditureFilterDto } from '../dto/expenditure.dto'
import { GeneralLedgerService, type JournalItemInput } from './general-ledger.service'

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
						amount: input.amount.toString(),
						...metadata,
					})
					.returning()

				if (!expenditure) throw new Error('Failed to create expenditure record')

				// 2. Prepare Journal Items
				// Standard: Debit the Target (Expense/Asset)
				const items: JournalItemInput[] = [
					{
						accountId: input.targetAccountId,
						debit: input.amount.toString(),
						credit: '0',
					},
				]

				if (input.isInstallment && input.liabilityAccountId) {
					const creditAccountId =
						input.status === 'PAID' ? input.sourceAccountId : input.liabilityAccountId
					items.push({
						accountId: creditAccountId,
						debit: '0',
						credit: input.amount.toString(),
					})
				} else {
					// Normal Logic: Target (DR) vs Source (CR)
					items.push({
						accountId: input.sourceAccountId,
						debit: '0',
						credit: input.amount.toString(),
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

				const res = expenditure
				await this.clearCache()
				return res
			})
		})
	}

	async listExpenditures(filter: ExpenditureFilterDto) {
		return record('ExpenditureService.listExpenditures', async () => {
			const { page, limit } = filter
			const key = `list.${JSON.stringify(filter)}`

			return cache.getOrSet({
				key,
				factory: async () => {
					const offset = (page - 1) * limit
					const { q, type, status, locationId } = filter

					const where = and(
						isNull(expendituresTable.deletedAt),
						q
							? or(
									searchFilter(expendituresTable.title, q),
									searchFilter(expendituresTable.description, q),
								)
							: undefined,
						type ? eq(expendituresTable.type, type) : undefined,
						status ? eq(expendituresTable.status, status) : undefined,
						locationId ? eq(expendituresTable.locationId, locationId) : undefined,
					)

					const data = await db
						.select()
						.from(expendituresTable)
						.where(where)
						.limit(limit)
						.offset(offset)
						.orderBy(desc(expendituresTable.date))

					return data
				},
			})
		})
	}

	private async clearCache() {
		await cache.deleteMany({ keys: ['list'] })
	}
}
