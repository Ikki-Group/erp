import { record } from '@elysiajs/opentelemetry'
import { and, eq, inArray, isNull } from 'drizzle-orm'

import { stampCreate, stampUpdate } from '@/core/database'

import { db } from '@/db'
import { materialLocationsTable } from '@/db/schema'

import type { MaterialLocationDto, MaterialLocationMutationDto } from '../dto'

export class MaterialLocationRepo {
	async getByMaterialId(materialId: number): Promise<MaterialLocationDto[]> {
		return record('MaterialLocationRepo.getByMaterialId', async () =>
			db
				.select()
				.from(materialLocationsTable)
				.where(
					and(
						eq(materialLocationsTable.materialId, materialId),
						isNull(materialLocationsTable.deletedAt),
					),
				),
		)
	}

	async getByMaterialAndLocation(
		materialId: number,
		locationId: number,
	): Promise<MaterialLocationDto | null> {
		return record('MaterialLocationRepo.getByMaterialAndLocation', async () =>
			db
				.select()
				.from(materialLocationsTable)
				.where(
					and(
						eq(materialLocationsTable.materialId, materialId),
						eq(materialLocationsTable.locationId, locationId),
						isNull(materialLocationsTable.deletedAt),
					),
				)
				.then((rows) => rows[0] ?? null),
		)
	}

	async create(
		data: MaterialLocationMutationDto & { createdBy: number },
	): Promise<{ id: number }> {
		return record('MaterialLocationRepo.create', async () => {
			const metadata = stampCreate(data.createdBy)
			const [result] = await db
				.insert(materialLocationsTable)
				.values({ ...data, ...metadata })
				.returning({ id: materialLocationsTable.id })

			if (!result) throw new Error('Failed to create material location')
			return result
		})
	}

	async update(
		id: number,
		data: Partial<MaterialLocationMutationDto> & { updatedBy: number },
	): Promise<{ id: number }> {
		return record('MaterialLocationRepo.update', async () => {
			const metadata = stampUpdate(data.updatedBy)
			await db
				.update(materialLocationsTable)
				.set({ ...data, ...metadata })
				.where(eq(materialLocationsTable.id, id))

			return { id }
		})
	}

	async softDelete(id: number, deletedBy: number): Promise<{ id: number }> {
		return record('MaterialLocationRepo.softDelete', async () => {
			const timestamp = new Date()
			await db
				.update(materialLocationsTable)
				.set({ deletedAt: timestamp, deletedBy })
				.where(eq(materialLocationsTable.id, id))

			return { id }
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('MaterialLocationRepo.hardDelete', async () => {
			const result = await db
				.delete(materialLocationsTable)
				.where(eq(materialLocationsTable.id, id))
				.returning({ id: materialLocationsTable.id })

			if (result.length === 0) throw new Error(`Material location ${id} not found`)
			return result[0]
		})
	}
}
