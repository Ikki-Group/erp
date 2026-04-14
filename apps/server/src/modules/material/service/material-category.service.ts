import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'

import { cache } from '@/core/cache'
import {
	checkConflict,
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirstOrThrow,
	type ConflictField,
} from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'
import { db } from '@/db'
import { materialCategoriesTable } from '@/db/schema'

import type {
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryMutationDto,
} from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Material category with ID ${id} not found`, 'MATERIAL_CATEGORY_NOT_FOUND'),
	createFailed: () =>
		new InternalServerError('Material category creation failed', 'MATERIAL_CATEGORY_CREATE_FAILED'),
}

const uniqueFields: ConflictField<'name'>[] = [
	{
		field: 'name',
		column: materialCategoriesTable.name,
		message: 'Material category name already exists',
		code: 'MATERIAL_CATEGORY_NAME_ALREADY_EXISTS',
	},
]

const cacheKey = {
	count: 'materialCategory.count',
	list: 'materialCategory.list',
	byId: (id: number) => `materialCategory.byId.${id}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class MaterialCategoryService {
	/**
	 * Returns all material categories, cached.
	 */
	async find(): Promise<MaterialCategoryDto[]> {
		return record('MaterialCategoryService.find', async () => {
			return cache.wrap(cacheKey.list, async () => {
				return db
					.select()
					.from(materialCategoriesTable)
					.where(isNull(materialCategoriesTable.deletedAt))
					.orderBy(materialCategoriesTable.name)
			})
		})
	}

	/**
	 * Finds a single material category by ID. Throws if not found.
	 */
	async getById(id: number): Promise<MaterialCategoryDto> {
		return record('MaterialCategoryService.getById', async () => {
			return cache.wrap(cacheKey.byId(id), async () => {
				const result = await db
					.select()
					.from(materialCategoriesTable)
					.where(and(eq(materialCategoriesTable.id, id), isNull(materialCategoriesTable.deletedAt)))
				return takeFirstOrThrow(
					result,
					`Material category with ID ${id} not found`,
					'MATERIAL_CATEGORY_NOT_FOUND',
				)
			})
		})
	}

	/**
	 * Returns total count of material categories, cached.
	 */
	async count(): Promise<number> {
		return record('MaterialCategoryService.count', async () => {
			return cache.wrap(cacheKey.count, async () => {
				const result = await db
					.select({ val: count() })
					.from(materialCategoriesTable)
					.where(isNull(materialCategoriesTable.deletedAt))
				return result[0]?.val ?? 0
			})
		})
	}

	/**
	 * Fetches paginated list of material categories.
	 */
	async handleList(
		filter: MaterialCategoryFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<MaterialCategoryDto>> {
		return record('MaterialCategoryService.handleList', async () => {
			const { search, parentId } = filter
			const where = and(
				isNull(materialCategoriesTable.deletedAt),
				searchFilter(materialCategoriesTable.name, search),
				parentId === undefined ? undefined : eq(materialCategoriesTable.parentId, parentId),
			)

			return paginate<MaterialCategoryDto>({
				data: ({ limit, offset }) =>
					db
						.select()
						.from(materialCategoriesTable)
						.where(where)
						.orderBy(sortBy(materialCategoriesTable.updatedAt, 'desc'))
						.limit(limit)
						.offset(offset),
				pq,
				countQuery: db.select({ count: count() }).from(materialCategoriesTable).where(where),
			})
		})
	}

	/**
	 * Serves material category detail.
	 */
	async handleDetail(id: number): Promise<MaterialCategoryDto> {
		return record('MaterialCategoryService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	/**
	 * Creates a new material category. Invalidates cache.
	 */
	async handleCreate(data: MaterialCategoryMutationDto, actorId: number): Promise<{ id: number }> {
		return record('MaterialCategoryService.handleCreate', async () => {
			const name = data.name.trim()

			await checkConflict({
				table: materialCategoriesTable,
				pkColumn: materialCategoriesTable.id,
				fields: uniqueFields,
				input: { name },
			})

			const [inserted] = await db
				.insert(materialCategoriesTable)
				.values({ ...data, name, ...stampCreate(actorId) })
				.returning({ id: materialCategoriesTable.id })

			if (!inserted) throw err.createFailed()

			await this.clearCache()
			return inserted
		})
	}

	/**
	 * Updates existing material category. Invalidates cache.
	 */
	async handleUpdate(
		id: number,
		data: Partial<MaterialCategoryMutationDto>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('MaterialCategoryService.handleUpdate', async () => {
			const existing = await this.getById(id)

			const name = data.name ? data.name.trim() : existing.name

			await checkConflict({
				table: materialCategoriesTable,
				pkColumn: materialCategoriesTable.id,
				fields: uniqueFields,
				input: { name },
				existing,
			})

			await db
				.update(materialCategoriesTable)
				.set({ ...data, name, ...stampUpdate(actorId) })
				.where(eq(materialCategoriesTable.id, id))

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Marks a material category as deleted (Soft Delete).
	 */
	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('MaterialCategoryService.handleRemove', async () => {
			const result = await db
				.update(materialCategoriesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(materialCategoriesTable.id, id))
				.returning({ id: materialCategoriesTable.id })

			if (result.length === 0) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Permanently deletes a material category (Hard Delete).
	 * USE WITH CAUTION.
	 */
	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('MaterialCategoryService.handleHardRemove', async () => {
			const result = await db
				.delete(materialCategoriesTable)
				.where(eq(materialCategoriesTable.id, id))
				.returning({ id: materialCategoriesTable.id })
			if (result.length === 0) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Clears relevant material category caches.
	 */
	private async clearCache(id?: number) {
		await Promise.all([
			cache.del(cacheKey.count),
			cache.del(cacheKey.list),
			id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
		])
	}
}
