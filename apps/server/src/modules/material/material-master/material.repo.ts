import { record } from '@elysiajs/opentelemetry'
import { count, eq, inArray } from 'drizzle-orm'

import { stampCreate, stampUpdate, takeFirst, type DbClient } from '@/core/database'

import { materialsTable } from '@/db/schema'

import type { MaterialDto, MaterialMutationDto } from './material.dto'

export class MaterialRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getList(): Promise<MaterialDto[]> {
		return record('MaterialRepo.getList', async () => {
			return this.db.select().from(materialsTable).orderBy(materialsTable.name)
		})
	}

	async getById(id: number): Promise<MaterialDto | undefined> {
		return record('MaterialRepo.getById', async () => {
			const res = await this.db
				.select()
				.from(materialsTable)
				.where(eq(materialsTable.id, id))
				.then(takeFirst)
			return res
		})
	}

	async getByIds(ids: number[]): Promise<MaterialDto[]> {
		if (ids.length === 0) return []
		return record('MaterialRepo.getByIds', async () => {
			return this.db.select().from(materialsTable).where(inArray(materialsTable.id, ids))
		})
	}

	async count(): Promise<number> {
		return record('MaterialRepo.count', async () => {
			return this.db
				.select({ count: count() })
				.from(materialsTable)
				.then((rows) => rows[0]?.count ?? 0)
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: MaterialMutationDto & { createdBy: number }): Promise<{ id: number }> {
		return record('MaterialRepo.create', async () => {
			const metadata = stampCreate(data.createdBy)
			const { ...materialData } = data

			const [material] = await this.db
				.insert(materialsTable)
				.values({
					...materialData,
					...metadata,
				})
				.returning({ id: materialsTable.id })

			if (!material) throw new Error('Material creation failed')

			return material
		})
	}

	async update(
		id: number,
		data: Partial<MaterialMutationDto> & { updatedBy: number },
	): Promise<{ id: number }> {
		return record('MaterialRepo.update', async () => {
			const metadata = stampUpdate(data.updatedBy)
			const { ...updateData } = data

			await this.db
				.update(materialsTable)
				.set({ ...updateData, ...metadata })
				.where(eq(materialsTable.id, id))

			return { id }
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('MaterialRepo.remove', async () => {
			const [res] = await this.db
				.delete(materialsTable)
				.where(eq(materialsTable.id, id))
				.returning({ id: materialsTable.id })

			return res?.id
		})
	}
}
