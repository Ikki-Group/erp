import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import { paginate, searchFilter, sortBy, stampCreate, stampUpdate, takeFirst, type WithPaginationResult } from '@/core/database'

import { db } from '@/db'
import { materialCategoriesTable } from '@/db/schema'

import type { MaterialCategoryDto, MaterialCategoryFilterDto, MaterialCategoryMutationDto } from '../dto'

const cache = bento.namespace('material-category')

export class MaterialCategoryRepo {
	/* -------------------------------- INTERNAL -------------------------------- */

	#clearCache(id?: number): Promise<void> {
		return record('MaterialCategoryRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await cache.deleteMany({ keys })
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getList(): Promise<MaterialCategoryDto[]> {
		return record('MaterialCategoryRepo.getList', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => {
					return db
						.select()
						.from(materialCategoriesTable)
						.where(isNull(materialCategoriesTable.deletedAt))
						.orderBy(materialCategoriesTable.name)
				},
			})
		})
	}

	async getListPaginated(filter: MaterialCategoryFilterDto): Promise<WithPaginationResult<MaterialCategoryDto>> {
		return record('MaterialCategoryRepo.getListPaginated', async () => {
			const { q, parentId, page, limit } = filter
			const where = and(
				isNull(materialCategoriesTable.deletedAt),
				searchFilter(materialCategoriesTable.name, q),
				parentId === undefined ? undefined : eq(materialCategoriesTable.parentId, parentId),
			)

			return paginate<MaterialCategoryDto>({
				data: ({ limit: l, offset }) =>
					db
						.select()
						.from(materialCategoriesTable)
						.where(where)
						.orderBy(sortBy(materialCategoriesTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(materialCategoriesTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<MaterialCategoryDto | undefined> {
		return record('MaterialCategoryRepo.getById', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = await db
						.select()
						.from(materialCategoriesTable)
						.where(
							and(eq(materialCategoriesTable.id, id), isNull(materialCategoriesTable.deletedAt)),
						)
						.then(takeFirst)
					return res ?? skip()
				},
			})
		})
	}

	async count(): Promise<number> {
		return record('MaterialCategoryRepo.count', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.count,
				factory: async () => {
					return db
						.select({ count: count() })
						.from(materialCategoriesTable)
						.where(isNull(materialCategoriesTable.deletedAt))
						.then((rows) => rows[0]?.count ?? 0)
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

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
			void this.#clearCache()
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

			void this.#clearCache(id)
			return { id }
		})
	}

	async remove(id: number, actorId: number): Promise<{ id: number } | undefined> {
		return record('MaterialCategoryRepo.remove', async () => {
			const [res] = await db
				.update(materialCategoriesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(materialCategoriesTable.id, id))
				.returning({ id: materialCategoriesTable.id })

			void this.#clearCache(id)
			return res
		})
	}

	async hardRemove(id: number): Promise<{ id: number } | undefined> {
		return record('MaterialCategoryRepo.hardRemove', async () => {
			const [res] = await db
				.delete(materialCategoriesTable)
				.where(eq(materialCategoriesTable.id, id))
				.returning({ id: materialCategoriesTable.id })

			void this.#clearCache(id)
			return res
		})
	}
}
