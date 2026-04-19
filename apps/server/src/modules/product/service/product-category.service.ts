import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'

import { bento } from '@/core/cache'
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
import { productCategoriesTable } from '@/db/schema'

import type {
	ProductCategoryDto,
	ProductCategoryFilterDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
} from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Product category with ID ${id} not found`, 'PRODUCT_CATEGORY_NOT_FOUND'),
	createFailed: () =>
		new InternalServerError('Product category creation failed', 'PRODUCT_CATEGORY_CREATE_FAILED'),
}

const uniqueFields: ConflictField<'name'>[] = [
	{
		field: 'name',
		column: productCategoriesTable.name,
		message: 'Product category name already exists',
		code: 'PRODUCT_CATEGORY_NAME_ALREADY_EXISTS',
	},
]

const cache = bento.namespace('product-category')

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class ProductCategoryService {
	/**
	 * Returns all product categories, cached.
	 * Excludes soft-deleted records.
	 */
	async find(): Promise<ProductCategoryDto[]> {
		return record('ProductCategoryService.find', async () => {
			return cache.getOrSet({
				key: 'list',
				factory: async () => {
					return db
						.select()
						.from(productCategoriesTable)
						.where(isNull(productCategoriesTable.deletedAt))
						.orderBy(productCategoriesTable.name)
				},
			})
		})
	}

	/**
	 * Finds a single product category by ID. Throws if not found or soft-deleted.
	 */
	async getById(id: number): Promise<ProductCategoryDto> {
		return record('ProductCategoryService.getById', async () => {
			return cache.getOrSet({
				key: `${id}`,
				factory: async () => {
					const result = await db
						.select()
						.from(productCategoriesTable)
						.where(and(eq(productCategoriesTable.id, id), isNull(productCategoriesTable.deletedAt)))
					return takeFirstOrThrow(
						result,
						`Product category with ID ${id} not found`,
						'PRODUCT_CATEGORY_NOT_FOUND',
					)
				},
			})
		})
	}

	/**
	 * Returns total count of product categories, cached.
	 */
	async count(): Promise<number> {
		return record('ProductCategoryService.count', async () => {
			return cache.getOrSet({
				key: 'count',
				factory: async () => {
					const result = await db
						.select({ val: count() })
						.from(productCategoriesTable)
						.where(isNull(productCategoriesTable.deletedAt))
					return result[0]?.val ?? 0
				},
			})
		})
	}

	/**
	 * Fetches paginated list of product categories.
	 */
	async handleList(
		filter: ProductCategoryFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<ProductCategoryDto>> {
		return record('ProductCategoryService.handleList', async () => {
			const { q, parentId } = filter

			const where = and(
				isNull(productCategoriesTable.deletedAt),
				searchFilter(productCategoriesTable.name, q),
				parentId ? eq(productCategoriesTable.parentId, parentId) : undefined,
			)

			return paginate<ProductCategoryDto>({
				data: ({ limit, offset }) =>
					db
						.select()
						.from(productCategoriesTable)
						.where(where)
						.orderBy(sortBy(productCategoriesTable.updatedAt, 'desc'))
						.limit(limit)
						.offset(offset),
				pq,
				countQuery: db.select({ count: count() }).from(productCategoriesTable).where(where),
			})
		})
	}

	/**
	 * Serves product category detail.
	 */
	async handleDetail(id: number): Promise<ProductCategoryDto> {
		return record('ProductCategoryService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	/**
	 * Creates a new product category. Invalidates cache.
	 */
	async handleCreate(data: ProductCategoryCreateDto, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryService.handleCreate', async () => {
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

			if (!inserted) throw err.createFailed()

			await this.clearCache()
			return inserted
		})
	}

	/**
	 * Updates existing product category. Invalidates cache.
	 */
	async handleUpdate(id: number, data: ProductCategoryUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryService.handleUpdate', async () => {
			const existing = await this.getById(id)

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

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Marks a product category as deleted (Soft Delete).
	 * Used for crucial entities like Product Categories.
	 */
	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryService.handleRemove', async () => {
			const result = await db
				.update(productCategoriesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(productCategoriesTable.id, id))
				.returning({ id: productCategoriesTable.id })

			if (result.length === 0) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Permanently deletes a product category (Hard Delete).
	 * USE WITH CAUTION.
	 */
	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('ProductCategoryService.handleHardRemove', async () => {
			const result = await db
				.delete(productCategoriesTable)
				.where(eq(productCategoriesTable.id, id))
				.returning({ id: productCategoriesTable.id })

			if (result.length === 0) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Clears relevant product category caches.
	 */
	private async clearCache(id?: number) {
		const keys = ['count', 'list']
		if (id) keys.push(`${id}`)
		await cache.deleteMany({ keys })
	}
}
