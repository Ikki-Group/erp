import { record } from '@elysiajs/opentelemetry'
import { and, eq, isNull } from 'drizzle-orm'

import { takeFirst } from '@/core/database'

import { db } from '@/db'
import { uomsTable } from '@/db/schema'

import type { UomDto } from '../dto'

export class UomRepo {
	async getList(): Promise<UomDto[]> {
		return record('UomRepo.getList', async () =>
			db
				.select()
				.from(uomsTable)
				.where(isNull(uomsTable.deletedAt))
				.orderBy(uomsTable.name),
		)
	}

	async getById(id: number): Promise<UomDto | null> {
		return record('UomRepo.getById', async () =>
			db
				.select()
				.from(uomsTable)
				.where(and(eq(uomsTable.id, id), isNull(uomsTable.deletedAt)))
				.then(takeFirst),
		)
	}
}
