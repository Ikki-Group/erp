import { and, count, eq, not } from 'drizzle-orm'

import { productCategoriesTable } from '@/db/schema'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	type DbClient,
	type WithPaginationResult,
} from '@/infra/database'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

import type { ActorId, EntityRef } from '@/types/utils'

import {
	ProductCategorySchema,
	type ProductCategoryFilterSchema,
	type ProductCategoryCreateSchema,
	type ProductCategoryUpdateSchema,
} from './category.schema'

export class ProductCategoryRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<ProductCategorySchema | undefined> {
		const [result] = await this.db
			.select()
			.from(productCategoriesTable)
			.where(eq(productCategoriesTable.id, id))
			.limit(1)
		return result ? ProductCategorySchema.parse(result) : undefined
	}

	async getListPaginated(
		filter: ProductCategoryFilterSchema,
	): Promise<WithPaginationResult<ProductCategorySchema>> {
		const { q, locationId, page, limit } = filter

		const conditions = [
			searchFilter(productCategoriesTable.name, q),
			locationId ? eq(productCategoriesTable.locationId, locationId) : undefined,
		].filter((c): c is NonNullable<typeof c> => c !== undefined)

		const where = conditions.length > 0 ? and(...conditions) : undefined

		return paginate({
			data: async ({ limit: l, offset }) => {
				const rows = await this.db
					.select()
					.from(productCategoriesTable)
					.where(where)
					.orderBy(sortBy(productCategoriesTable.updatedAt, 'desc'))
					.limit(l)
					.offset(offset)
				return rows.map((r) => ProductCategorySchema.parse(r))
			},
			pq: { page, limit },
			countQuery: this.db.select({ count: count() }).from(productCategoriesTable).where(where),
		})
	}

	async getAll(locationId?: number): Promise<ProductCategorySchema[]> {
		const conditions = [
			locationId ? eq(productCategoriesTable.locationId, locationId) : undefined,
		].filter((c): c is NonNullable<typeof c> => c !== undefined)

		const where = conditions.length > 0 ? and(...conditions) : undefined
		const rows = await this.db
			.select()
			.from(productCategoriesTable)
			.where(where)
			.orderBy(productCategoriesTable.name)
		return rows.map((r) => ProductCategorySchema.parse(r))
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: ProductCategoryCreateSchema, actorId: ActorId): Promise<EntityRef> {
		const name = data.name.trim()

		const [conflict] = await this.db
			.select()
			.from(productCategoriesTable)
			.where(
				and(
					eq(productCategoriesTable.locationId, data.locationId),
					eq(productCategoriesTable.name, name),
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

		return { id: inserted.id }
	}

	async update(
		id: number,
		data: ProductCategoryUpdateSchema,
		actorId: ActorId,
	): Promise<EntityRef> {
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
	}

	async softDelete(id: number): Promise<EntityRef> {
		const [result] = await this.db
			.delete(productCategoriesTable)
			.where(eq(productCategoriesTable.id, id))
			.returning({ id: productCategoriesTable.id })

		if (!result)
			throw new NotFoundError(
				`Product category with ID ${id} not found`,
				'PRODUCT_CATEGORY_NOT_FOUND',
			)

		return { id: result.id }
	}

	async hardDelete(id: number): Promise<EntityRef> {
		const [result] = await this.db
			.delete(productCategoriesTable)
			.where(eq(productCategoriesTable.id, id))
			.returning({ id: productCategoriesTable.id })

		if (!result)
			throw new NotFoundError(
				`Product category with ID ${id} not found`,
				'PRODUCT_CATEGORY_NOT_FOUND',
			)

		return { id: result.id }
	}
}
