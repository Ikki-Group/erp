import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import {
	checkConflict,
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	type ConflictField,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import { logger } from '@/core/logger'

import { productCategoriesTable } from '@/db/schema'

import {
	ProductCategoryDto,
	ProductCategoryFilterDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
} from './product-category.dto'

const PRODUCT_CATEGORY_CACHE_NAMESPACE = 'product-category'

const uniqueFields: ConflictField<'name'>[] = [
	{
		field: 'name',
		column: productCategoriesTable.name,
		message: 'Product category name already exists',
		code: 'PRODUCT_CATEGORY_NAME_ALREADY_EXISTS',
	},
]

export class ProductCategoryRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(PRODUCT_CATEGORY_CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.count, CACHE_KEY_DEFAULT.list]
		if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await this.cache.deleteMany({ keys })
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'ProductCategoryRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<ProductCategoryDto | undefined> {
		return record('ProductCategoryRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const [result] = await this.db
						.select()
						.from(productCategoriesTable)
						.where(and(eq(productCategoriesTable.id, id), isNull(productCategoriesTable.deletedAt)))

					if (!result) return skip()
					return ProductCategoryDto.parse(result)
				},
			})
		})
	}

	async getListPaginated(
		filter: ProductCategoryFilterDto,
	): Promise<WithPaginationResult<ProductCategoryDto>> {
		return record('ProductCategoryRepo.getListPaginated', async () => {
			const { q, parentId, page, limit } = filter

			const where = and(
				isNull(productCategoriesTable.deletedAt),
				searchFilter(productCategoriesTable.name, q),
				parentId ? eq(productCategoriesTable.parentId, parentId) : undefined,
			)

			return paginate({
				data: async ({ limit: l, offset }) => {
					const rows = await this.db
						.select()
						.from(productCategoriesTable)
						.where(where)
						.orderBy(sortBy(productCategoriesTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset)
					return rows.map((r) => ProductCategoryDto.parse(r))
				},
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(productCategoriesTable).where(where),
			})
		})
	}

	async getAll(): Promise<ProductCategoryDto[]> {
		return record('ProductCategoryRepo.getAll', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => {
					const rows = await this.db
						.select()
						.from(productCategoriesTable)
						.where(isNull(productCategoriesTable.deletedAt))
						.orderBy(productCategoriesTable.name)
					return rows.map((r) => ProductCategoryDto.parse(r))
				},
			})
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

			const [inserted] = await this.db
				.insert(productCategoriesTable)
				.values({ ...data, name, ...stampCreate(actorId) })
				.returning({ id: productCategoriesTable.id })

			if (!inserted)
				throw new InternalServerError(
					'Product category creation failed',
					'PRODUCT_CATEGORY_CREATE_FAILED',
				)

			this.#clearCacheAsync()
			return inserted
		})
	}

	async update(
		id: number,
		data: ProductCategoryUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('ProductCategoryRepo.update', async () => {
			const existing = await this.getById(id)
			if (!existing)
				throw new NotFoundError(
					`Product category with ID ${id} not found`,
					'PRODUCT_CATEGORY_NOT_FOUND',
				)

			const name = data.name ? data.name.trim() : existing.name

			await checkConflict({
				table: productCategoriesTable,
				pkColumn: productCategoriesTable.id,
				fields: uniqueFields,
				input: { name },
				existing,
			})

			await this.db
				.update(productCategoriesTable)
				.set({ ...data, name, ...stampUpdate(actorId) })
				.where(eq(productCategoriesTable.id, id))

			this.#clearCacheAsync(id)
			return { id }
		})
	}

	async softDelete(id: number, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryRepo.softDelete', async () => {
			const result = await this.db
				.update(productCategoriesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(productCategoriesTable.id, id))
				.returning({ id: productCategoriesTable.id })

			if (result.length === 0)
				throw new NotFoundError(
					`Product category with ID ${id} not found`,
					'PRODUCT_CATEGORY_NOT_FOUND',
				)

			this.#clearCacheAsync(id)
			return { id }
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('ProductCategoryRepo.hardDelete', async () => {
			const result = await this.db
				.delete(productCategoriesTable)
				.where(eq(productCategoriesTable.id, id))
				.returning({ id: productCategoriesTable.id })

			if (result.length === 0)
				throw new NotFoundError(
					`Product category with ID ${id} not found`,
					'PRODUCT_CATEGORY_NOT_FOUND',
				)

			this.#clearCacheAsync(id)
			return { id }
		})
	}
}
