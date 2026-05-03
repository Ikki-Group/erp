/* eslint-disable @typescript-eslint/no-deprecated */
import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import { materialCategoriesTable } from '@/db/schema'

import {
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryMutationDto,
} from './material-category.dto'

export class MaterialCategoryRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getList(): Promise<MaterialCategoryDto[]> {
		return record('MaterialCategoryRepo.getList', async () => {
			return this.db
				.select()
				.from(materialCategoriesTable)
				.where(isNull(materialCategoriesTable.deletedAt))
				.orderBy(materialCategoriesTable.name)
		})
	}

	async getListPaginated(
		filter: MaterialCategoryFilterDto,
	): Promise<WithPaginationResult<MaterialCategoryDto>> {
		return record('MaterialCategoryRepo.getListPaginated', async () => {
			const { q, parentId, page, limit } = filter
			const where = and(
				isNull(materialCategoriesTable.deletedAt),
				searchFilter(materialCategoriesTable.name, q),
				parentId === undefined ? undefined : eq(materialCategoriesTable.parentId, parentId),
			)

			return paginate<MaterialCategoryDto>({
				data: ({ limit: l, offset }) =>
					this.db
						.select()
						.from(materialCategoriesTable)
						.where(where)
						.orderBy(sortBy(materialCategoriesTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(materialCategoriesTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<MaterialCategoryDto | undefined> {
		return record('MaterialCategoryRepo.getById', async () => {
			return this.db
				.select()
				.from(materialCategoriesTable)
				.where(and(eq(materialCategoriesTable.id, id), isNull(materialCategoriesTable.deletedAt)))
				.then(takeFirst)
		})
	}

	async count(): Promise<number> {
		return record('MaterialCategoryRepo.count', async () => {
			return this.db
				.select({ count: count() })
				.from(materialCategoriesTable)
				.where(isNull(materialCategoriesTable.deletedAt))
				.then((rows) => rows[0]?.count ?? 0)
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(
		data: z.infer<typeof MaterialCategoryMutationDto> & { createdBy: number },
	): Promise<{ id: number }> {
		return record('MaterialCategoryRepo.create', async () => {
			const metadata = stampCreate(data.createdBy)
			const [result] = await this.db
				.insert(materialCategoriesTable)
				.values({ ...data, ...metadata })
				.returning({ id: materialCategoriesTable.id })

			if (!result) throw new Error('Failed to create material category')
			return result
		})
	}

	async update(
		id: number,
		data: Partial<z.infer<typeof MaterialCategoryMutationDto>> & { updatedBy: number },
	): Promise<{ id: number }> {
		return record('MaterialCategoryRepo.update', async () => {
			const metadata = stampUpdate(data.updatedBy)
			await this.db
				.update(materialCategoriesTable)
				.set({ ...data, ...metadata })
				.where(eq(materialCategoriesTable.id, id))

			return { id }
		})
	}

	async remove(id: number, actorId: number): Promise<{ id: number } | undefined> {
		return record('MaterialCategoryRepo.remove', async () => {
			const [res] = await this.db
				.update(materialCategoriesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(materialCategoriesTable.id, id))
				.returning({ id: materialCategoriesTable.id })

			return res
		})
	}

	async hardRemove(id: number): Promise<{ id: number } | undefined> {
		return record('MaterialCategoryRepo.hardRemove', async () => {
			const [res] = await this.db
				.delete(materialCategoriesTable)
				.where(eq(materialCategoriesTable.id, id))
				.returning({ id: materialCategoriesTable.id })

			return res
		})
	}
}
