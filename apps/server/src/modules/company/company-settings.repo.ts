/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-argument */
import { record } from '@elysiajs/opentelemetry'
import { eq } from 'drizzle-orm'

import { stampCreate, stampUpdate, takeFirst, type DbClient } from '@/core/database'

import { companySettingsTable } from '@/db/schema'

import * as dto from './company-settings.dto'

export class CompanySettingsRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async get(): Promise<dto.CompanySettingsDto | undefined> {
		return record('CompanySettingsRepo.get', async () => {
			const res = await this.db.select().from(companySettingsTable).limit(1).then(takeFirst)

			return res ? dto.CompanySettingsDto.parse(res) : undefined
		})
	}

	async getById(id: number): Promise<dto.CompanySettingsDto | undefined> {
		return record('CompanySettingsRepo.getById', async () => {
			const res = await this.db
				.select()
				.from(companySettingsTable)
				.where(eq(companySettingsTable.id, id))
				.limit(1)
				.then(takeFirst)

			return res ? dto.CompanySettingsDto.parse(res) : undefined
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.CompanySettingsCreateDto, actorId: number): Promise<number | undefined> {
		return record('CompanySettingsRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(companySettingsTable)
				.values({ ...data, ...metadata } as any)
				.returning({ id: companySettingsTable.id })

			return res?.id
		})
	}

	async update(data: dto.CompanySettingsUpdateDto, actorId: number): Promise<number | undefined> {
		return record('CompanySettingsRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(companySettingsTable)
				.set({ ...data, ...metadata } as any)
				.where(eq(companySettingsTable.id, data.id))
				.returning({ id: companySettingsTable.id })

			return res?.id
		})
	}
}
