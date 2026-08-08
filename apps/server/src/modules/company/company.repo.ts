import { companySettings } from '@/db/schema/core.ts'

import { eq, sql, takeFirst } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { CompanySettingsDto } from './company.contract.ts'

// ─── Types ───

type CompanySettingsInsert = typeof companySettings.$inferInsert
type CompanySettingsUpdate = Partial<Omit<CompanySettingsInsert, 'id'>>
type CompanySettingsRow = typeof companySettings.$inferSelect

/** Maps a raw DB row to the DTO shape. */
function toDto(row: CompanySettingsRow): CompanySettingsDto {
	return {
		id: row.id,
		name: row.name,
		address: row.address,
		phone: row.phone,
		email: row.email,
		taxId: row.taxId,
		taxRate: row.taxRate ?? '0',
		currencyCode: row.currencyCode,
		currencySymbol: row.currencySymbol,
		logoUrl: row.logoUrl,
		receiptFooter: row.receiptFooter,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface ICompanyRepo {
	readonly db: DbContext
	findOne(db?: DbContext): Promise<CompanySettingsDto | undefined>
	count(db?: DbContext): Promise<number>
	insert(data: CompanySettingsInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: CompanySettingsUpdate, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class CompanyRepo implements ICompanyRepo {
	constructor(readonly db: DbContext) {}

	async findOne(db: DbContext = this.db): Promise<CompanySettingsDto | undefined> {
		const row = await db.select().from(companySettings).limit(1).then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async count(db: DbContext = this.db): Promise<number> {
		const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(companySettings)
		return result?.count ?? 0
	}

	async insert(
		data: CompanySettingsInsert,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(companySettings)
			.values(data)
			.returning({ id: companySettings.id })
		return result
	}

	async update(
		id: number,
		data: CompanySettingsUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(companySettings)
			.set(data)
			.where(eq(companySettings.id, id))
			.returning({ id: companySettings.id })
		return result
	}
}
