import { record } from '@elysiajs/opentelemetry'
import { and, eq, isNull } from 'drizzle-orm'

import { stampCreate, stampUpdate, takeFirst } from '@/core/database'

import { db } from '@/db'
import { materialCategoriesTable } from '@/db/schema'

import type { MaterialCategoryDto, MaterialCategoryMutationDto } from '../dto'

export class MaterialCategoryRepo {
	async getList(): Promise<MaterialCategoryDto[]> {
		return record('MaterialCategoryRepo.getList', async () =>
			db
				.select()
				.from(materialCategoriesTable)
				.where(isNull(materialCategoriesTable.deletedAt))
				.orderBy(materialCategoriesTable.name),
		)
	}

	async getById(id: number): Promise<MaterialCategoryDto | null> {
		return record('MaterialCategoryRepo.getById', async () =>
			db
				.select()
				.from(materialCategoriesTable)
				.where(
					and(eq(materialCategoriesTable.id, id), isNull(materialCategoriesTable.deletedAt)),
				)
				.then(takeFirst),
		)
	}

	async create(
		data: MaterialCategoryMutationDto & { createdBy: number },
	): Promise<{ id: number }> {
		return record('MaterialCategoryRepo.create', async () => {
			const metadata = stampCreate(data.createdBy)
			const [result] = await db
				.insert(materialCategoriesTable)
				.values({ ...data, ...metadata })
				.returning({ id: materialCategoriesTable.id })

			if (!result) throw new Error('Failed to create material category')
			return result
		})
	}

	async update(
		id: number,
		data: Partial<MaterialCategoryMutationDto> & { updatedBy: number },
	): Promise<{ id: number }> {
		return record('MaterialCategoryRepo.update', async () => {
			const metadata = stampUpdate(data.updatedBy)
			await db
				.update(materialCategoriesTable)
				.set({ ...data, ...metadata })
				.where(eq(materialCategoriesTable.id, id))

			return { id }
		})
	}
}
