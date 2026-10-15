import { companySettings } from '@/db/schema/core.ts'

import { createCrudRepo } from '@/infra/database/crud.repo.ts'
import type { CrudRepo } from '@/infra/database/crud.repo.ts'
import { takeFirst } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { CompanySettingsDto } from './company.contract.ts'

// ─── Types ───

type CompanySettingsInsert = typeof companySettings.$inferInsert
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

/** Singleton settings row: read the one row, update it by id. */
export interface ICompanyRepo extends Pick<
	CrudRepo<CompanySettingsDto, CompanySettingsInsert>,
	'update'
> {
	findOne(db?: DbContext): Promise<CompanySettingsDto | undefined>
}

// ─── Implementation ───

export function createCompanyRepo(baseDb: DbContext): ICompanyRepo {
	const crud = createCrudRepo({ db: baseDb, table: companySettings, toDto })

	return {
		update: crud.update,

		async findOne(db = baseDb) {
			const row = await db.select().from(companySettings).limit(1).then(takeFirst)
			return row ? toDto(row) : undefined
		},
	}
}
