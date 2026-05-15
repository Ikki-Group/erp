import { count, eq } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
} from '@/core/database'
import type { WithPaginationResult } from '@/core/database/pagination'

import { materialCategoriesTable } from '@/db/schema'

import type { ActorId, EntityRef } from '@/types/utils'

import type {
	MaterialCategoryFilterSchema,
	MaterialCategoryMutationSchema,
	MaterialCategorySchema,
} from './material-category.schema'

export class MaterialCategoryRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getList(): Promise<MaterialCategorySchema[]> {
		return this.db.select().from(materialCategoriesTable).orderBy(materialCategoriesTable.name)
	}

	async getListPaginated(
		filter: MaterialCategoryFilterSchema,
	): Promise<WithPaginationResult<MaterialCategorySchema>> {
		const { q } = filter
		const where = searchFilter(materialCategoriesTable.name, q)

		return paginate<MaterialCategorySchema>({
			data: ({ limit, offset }) =>
				this.db
					.select()
					.from(materialCategoriesTable)
					.where(where)
					.orderBy(sortBy(materialCategoriesTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: this.db.select({ count: count() }).from(materialCategoriesTable).where(where),
		})
	}

	async getById(id: number): Promise<MaterialCategorySchema | undefined> {
		return this.db
			.select()
			.from(materialCategoriesTable)
			.where(eq(materialCategoriesTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async count(): Promise<number> {
		return this.db
			.select({ count: count() })
			.from(materialCategoriesTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(
		data: MaterialCategoryMutationSchema,
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const metadata = stampCreate(actorId)
		const [res] = await this.db
			.insert(materialCategoriesTable)
			.values({ ...data, ...metadata })
			.returning({ id: materialCategoriesTable.id })

		return res
	}

	async update(
		id: number,
		data: MaterialCategoryMutationSchema,
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const metadata = stampUpdate(actorId)
		const [res] = await this.db
			.update(materialCategoriesTable)
			.set({ ...data, ...metadata })
			.where(eq(materialCategoriesTable.id, id))
			.returning({ id: materialCategoriesTable.id })

		return res
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		const [res] = await this.db
			.delete(materialCategoriesTable)
			.where(eq(materialCategoriesTable.id, id))
			.returning({ id: materialCategoriesTable.id })

		return res
	}
}
