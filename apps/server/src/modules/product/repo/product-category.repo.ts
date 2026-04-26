import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import {
	checkConflict,
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	type ConflictField,
} from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'

import { db } from '@/db'
import { productCategoriesTable } from '@/db/schema'

import type {
	ProductCategoryDto,
	ProductCategoryFilterDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
} from '../dto'

const cache = bento.namespace('product-category')

const uniqueFields: ConflictField<'name'>[] = [
	{
		field: 'name',
		column: productCategoriesTable.name,
		message: 'Product category name already exists',
		code: 'PRODUCT_CATEGORY_NAME_ALREADY_EXISTS',
	},
]

export class ProductCategoryRepo {
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.count, CACHE_KEY_DEFAULT.list]
		if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await cache.deleteMany({ keys })
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<ProductCategoryDto | undefined> {
		return record('ProductCategoryRepo.getById', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const result = await db
						.select()
						.from(productCategoriesTable)
						.where(and(eq(productCategoriesTable.id, id), isNull(productCategoriesTable.deletedAt)))

					if (result.length === 0) return skip()
					return result[0] as unknown as ProductCategoryDto
				},
			})
		})
	}

	async getListPaginated(filter: ProductCategoryFilterDto): Promise<any> {
		return record('ProductCategoryRepo.getListPaginated', async () => {
			const { q, parentId, page, limit } = filter

			const where = and(
				isNull(productCategoriesTable.deletedAt),
				searchFilter(productCategoriesTable.name, q),
				parentId ? eq(productCategoriesTable.parentId, parentId) : undefined,
			)

			return paginate({
				data: ({ limit: l, offset }) =>
					db
						.select()
						.from(productCategoriesTable)
						.where(where)
						.orderBy(sortBy(productCategoriesTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(productCategoriesTable).where(where),
			})
		})
	}

	async getAll(): Promise<ProductCategoryDto[]> {
		return record('ProductCategoryRepo.getAll', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => {
					return db
						.select()
						.from(productCategoriesTable)
						.where(isNull(productCategoriesTable.deletedAt))
						.orderBy(productCategoriesTable.name)
				},
			}) as unknown as Promise<ProductCategoryDto[]>
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: ProductCategoryCreateDto, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryRepo.create', async () => {
			const name = data.name.trim()

			await checkConflict({
				table: productCategoriesTable,
				pkColumn: productCategoriesTable.id,
				fields: uniqueFields,
				input: { name },
			})

			const [inserted] = await db
				.insert(productCategoriesTable)
				.values({ ...data, name, ...stampCreate(actorId) })
				.returning({ id: productCategoriesTable.id })

			if (!inserted) throw new InternalServerError('Product category creation failed', 'PRODUCT_CATEGORY_CREATE_FAILED')

			void this.#clearCache()
			return inserted
		})
	}

	async update(id: number, data: ProductCategoryUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryRepo.update', async () => {
			const existing = await this.getById(id)
			if (!existing) throw new NotFoundError(`Product category with ID ${id} not found`, 'PRODUCT_CATEGORY_NOT_FOUND')

			const name = data.name ? data.name.trim() : existing.name

			await checkConflict({
				table: productCategoriesTable,
				pkColumn: productCategoriesTable.id,
				fields: uniqueFields,
				input: { name },
				existing,
			})

			await db
				.update(productCategoriesTable)
				.set({ ...data, name, ...stampUpdate(actorId) })
				.where(eq(productCategoriesTable.id, id))

			void this.#clearCache(id)
			return { id }
		})
	}

	async softDelete(id: number, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryRepo.softDelete', async () => {
			const result = await db
				.update(productCategoriesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(productCategoriesTable.id, id))
				.returning({ id: productCategoriesTable.id })

			if (result.length === 0) throw new NotFoundError(`Product category with ID ${id} not found`, 'PRODUCT_CATEGORY_NOT_FOUND')

			void this.#clearCache(id)
			return { id }
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('ProductCategoryRepo.hardDelete', async () => {
			const result = await db
				.delete(productCategoriesTable)
				.where(eq(productCategoriesTable.id, id))
				.returning({ id: productCategoriesTable.id })

			if (result.length === 0) throw new NotFoundError(`Product category with ID ${id} not found`, 'PRODUCT_CATEGORY_NOT_FOUND')

			void this.#clearCache(id)
			return { id }
		})
	}
}
