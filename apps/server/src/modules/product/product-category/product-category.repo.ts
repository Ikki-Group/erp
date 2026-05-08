import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull, not } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'

import { productCategoriesTable } from '@/db/schema'

import {
	ProductCategoryDto,
	ProductCategoryFilterDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
} from './product-category.dto'

export class ProductCategoryRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<ProductCategoryDto | undefined> {
		return record('ProductCategoryRepo.getById', async () => {
			const [result] = await this.db
				.select()
				.from(productCategoriesTable)
				.where(and(eq(productCategoriesTable.id, id), isNull(productCategoriesTable.deletedAt)))
			return result ? ProductCategoryDto.parse(result) : undefined
		})
	}

	async getListPaginated(
		filter: ProductCategoryFilterDto,
	): Promise<WithPaginationResult<ProductCategoryDto>> {
		return record('ProductCategoryRepo.getListPaginated', async () => {
			const { q, locationId, parentId, page, limit } = filter

			const where = and(
				isNull(productCategoriesTable.deletedAt),
				searchFilter(productCategoriesTable.name, q),
				locationId ? eq(productCategoriesTable.locationId, locationId) : undefined,
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

	async getAll(locationId?: number): Promise<ProductCategoryDto[]> {
		return record('ProductCategoryRepo.getAll', async () => {
			const where = and(
				isNull(productCategoriesTable.deletedAt),
				locationId ? eq(productCategoriesTable.locationId, locationId) : undefined,
			)
			const rows = await this.db
				.select()
				.from(productCategoriesTable)
				.where(where)
				.orderBy(productCategoriesTable.name)
			return rows.map((r) => ProductCategoryDto.parse(r))
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: ProductCategoryCreateDto, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryRepo.create', async () => {
			const name = data.name.trim()

			const [conflict] = await this.db
				.select()
				.from(productCategoriesTable)
				.where(
					and(
						eq(productCategoriesTable.locationId, data.locationId),
						eq(productCategoriesTable.name, name),
						isNull(productCategoriesTable.deletedAt),
					),
				)
				.limit(1)

			if (conflict) {
				throw new InternalServerError(
					'Product category name already exists in this location',
					'PRODUCT_CATEGORY_NAME_ALREADY_EXISTS',
				)
			}

			const [inserted] = await this.db
				.insert(productCategoriesTable)
				.values({ ...data, name, ...stampCreate(actorId) })
				.returning({ id: productCategoriesTable.id })

			if (!inserted)
				throw new InternalServerError(
					'Product category creation failed',
					'PRODUCT_CATEGORY_CREATE_FAILED',
				)

			return inserted
		})
	}

	async update(
		id: number,
		data: ProductCategoryUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('ProductCategoryRepo.update', async () => {
			const name = data.name ? data.name.trim() : undefined

			if (name && data.locationId) {
				const [conflict] = await this.db
					.select()
					.from(productCategoriesTable)
					.where(
						and(
							eq(productCategoriesTable.locationId, data.locationId),
							eq(productCategoriesTable.name, name),
							not(eq(productCategoriesTable.id, id)),
							isNull(productCategoriesTable.deletedAt),
						),
					)
					.limit(1)

				if (conflict) {
					throw new InternalServerError(
						'Product category name already exists in this location',
						'PRODUCT_CATEGORY_NAME_ALREADY_EXISTS',
					)
				}
			}

			await this.db
				.update(productCategoriesTable)
				.set({ ...data, name, ...stampUpdate(actorId) })
				.where(eq(productCategoriesTable.id, id))

			return { id }
		})
	}

	async softDelete(id: number, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryRepo.softDelete', async () => {
			const [result] = await this.db
				.update(productCategoriesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(productCategoriesTable.id, id))
				.returning({ id: productCategoriesTable.id })

			if (!result)
				throw new NotFoundError(
					`Product category with ID ${id} not found`,
					'PRODUCT_CATEGORY_NOT_FOUND',
				)

			return { id }
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('ProductCategoryRepo.hardDelete', async () => {
			const [result] = await this.db
				.delete(productCategoriesTable)
				.where(eq(productCategoriesTable.id, id))
				.returning({ id: productCategoriesTable.id })

			if (!result)
				throw new NotFoundError(
					`Product category with ID ${id} not found`,
					'PRODUCT_CATEGORY_NOT_FOUND',
				)

			return { id }
		})
	}
}
