/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-argument */
import { eq } from 'drizzle-orm'

import { companySettingsTable } from '@/db/schema'

import { stampCreate, stampUpdate, takeFirst, type DbClient } from '@/infra/database'

import type { ActorId, EntityRef } from '@/types/utils'

import {
	CompanySettingsSchema,
	type CompanySettingsCreateSchema,
	type CompanySettingsUpdateSchema,
} from './company-settings.schema'

export class CompanySettingsRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async get(): Promise<CompanySettingsSchema | undefined> {
		const res = await this.db.select().from(companySettingsTable).limit(1).then(takeFirst)

		return res ? CompanySettingsSchema.parse(res) : undefined
	}

	async getById(id: number): Promise<CompanySettingsSchema | undefined> {
		const res = await this.db
			.select()
			.from(companySettingsTable)
			.where(eq(companySettingsTable.id, id))
			.limit(1)
			.then(takeFirst)

		return res ? CompanySettingsSchema.parse(res) : undefined
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: CompanySettingsCreateSchema, actorId: ActorId): Promise<EntityRef> {
		const metadata = stampCreate(actorId)
		const [res] = await this.db
			.insert(companySettingsTable)
			.values({ ...data, ...metadata } as any)
			.returning({ id: companySettingsTable.id })

		return { id: res?.id ?? 0 }
	}

	async update(data: CompanySettingsUpdateSchema, actorId: ActorId): Promise<EntityRef> {
		const metadata = stampUpdate(actorId)
		const [res] = await this.db
			.update(companySettingsTable)
			.set({ ...data, ...metadata } as any)
			.where(eq(companySettingsTable.id, data.id))
			.returning({ id: companySettingsTable.id })

		return { id: res?.id ?? 0 }
	}
}
