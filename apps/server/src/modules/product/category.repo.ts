import { and, count, eq, type SQL } from 'drizzle-orm'

import { productCategoriesTable } from '@/db/schema/product'

import { paginate, sortBy, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	ProductCategoryDto,
	ProductCategoryFilterDto,
} from './category.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

type CategoryInsert = typeof productCategoriesTable.$inferInsert
type CategoryUpdate = PgUpdateSetSource<typeof productCategoriesTable>

export interface IProductCategoryRepo {
	readonly db: DbContext
	findMany(locationId?: number, db?: DbContext): Promise<ProductCategoryDto[]>
	findPage(filter: ProductCategoryFilterDto, db?: DbContext): Promise<WithPaginationResult<ProductCategoryDto>>
	findById(id: number, db?: DbContext): Promise<ProductCategoryDto | undefined>
	insert(data: CategoryInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: CategoryUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class ProductCategoryRepo implements IProductCategoryRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<Pick<ProductCategoryFilterDto, 'q' | 'locationId'>>): SQL | undefined {
		const { q, locationId } = filter
		const qFilter = q
			? eq(productCategoriesTable.name, q)
			: undefined
		const locationFilter = locationId
			? eq(productCategoriesTable.locationId, locationId)
			: undefined
		return and(qFilter, locationFilter)
	}

	async findMany(locationId?: number, db: DbContext = this.db): Promise<ProductCategoryDto[]> {
		const where = locationId
			? eq(productCategoriesTable.locationId, locationId)
			: undefined
		return db
			.select()
			.from(productCategoriesTable)
			.where(where)
			.orderBy(productCategoriesTable.name)
	}

	async findPage(
		filter: ProductCategoryFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<ProductCategoryDto>> {
		const where = this.#buildWhere(filter)

		return paginate<ProductCategoryDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(productCategoriesTable)
					.where(where)
					.orderBy(sortBy(productCategoriesTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () =>
				db.select({ count: count() }).from(productCategoriesTable).where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<ProductCategoryDto | undefined> {
		return db
			.select()
			.from(productCategoriesTable)
			.where(eq(productCategoriesTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async insert(data: CategoryInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(productCategoriesTable)
			.values({ ...data })
			.returning({ id: productCategoriesTable.id })
		return res
	}

	async update(
		id: number,
		data: CategoryUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(productCategoriesTable)
			.set({ ...data })
			.where(eq(productCategoriesTable.id, id))
			.returning({ id: productCategoriesTable.id })
		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(productCategoriesTable)
			.where(eq(productCategoriesTable.id, id))
			.returning({ id: productCategoriesTable.id })
		return res
	}
}
