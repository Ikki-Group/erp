import { eq } from 'drizzle-orm'

import { companySettingsTable } from '@/db/schema'

import { takeFirst, type DbContext } from '@/infra/database'
import type { EntityRef } from '@/shared/types/utils'

import { CompanySettingsDto } from './company-settings.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

export type CompanySettingsInsert = typeof companySettingsTable.$inferInsert
export type CompanySettingsUpdate = PgUpdateSetSource<typeof companySettingsTable>

export interface ICompanySettingsRepo {
	readonly db: DbContext
	get(db?: DbContext): Promise<CompanySettingsDto | undefined>
	findById(id: number, db?: DbContext): Promise<CompanySettingsDto | undefined>
	insert(data: CompanySettingsInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: CompanySettingsUpdate, db?: DbContext): Promise<EntityRef | undefined>
}

export class CompanySettingsRepo implements ICompanySettingsRepo {
	constructor(readonly db: DbContext) {}

	async get(db: DbContext = this.db): Promise<CompanySettingsDto | undefined> {
		const res = await db.select().from(companySettingsTable).limit(1).then(takeFirst)

		return res ? CompanySettingsDto.parse(res) : undefined
	}

	async findById(id: number, db: DbContext = this.db): Promise<CompanySettingsDto | undefined> {
		const res = await db
			.select()
			.from(companySettingsTable)
			.where(eq(companySettingsTable.id, id))
			.limit(1)
			.then(takeFirst)

		return res ? CompanySettingsDto.parse(res) : undefined
	}

	async insert(data: CompanySettingsInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(companySettingsTable)
			.values({ ...data })
			.returning({ id: companySettingsTable.id })

		return res
	}

	async update(id: number, data: CompanySettingsUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(companySettingsTable)
			.set({ ...data })
			.where(eq(companySettingsTable.id, id))
			.returning({ id: companySettingsTable.id })

		return res
	}
}
