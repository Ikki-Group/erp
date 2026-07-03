import { count, eq, inArray } from 'drizzle-orm'

import { materialLocationsTable, materialsTable } from '@/db/schema'

import { paginate, sortBy, takeFirst, type DbClient } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'

import type { Material } from '../domain/material.entity'
import type {
	IMaterialRepo,
	MaterialInsertData,
	MaterialListFilter,
	MaterialUpdateData,
} from '../domain/ports'

export class MaterialRepo implements IMaterialRepo {
	constructor(readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getList(): Promise<Material[]> {
		return this.db.select().from(materialsTable).orderBy(materialsTable.name)
	}

	async getById(id: number): Promise<Material | undefined> {
		const res = await this.db
			.select()
			.from(materialsTable)
			.where(eq(materialsTable.id, id))
			.then(takeFirst)
		return res
	}

	async getByIds(ids: number[]): Promise<Material[]> {
		if (ids.length === 0) return []
		return this.db.select().from(materialsTable).where(inArray(materialsTable.id, ids))
	}

	async getListPaginated(filter: MaterialListFilter): Promise<WithPaginationResult<Material>> {
		const { search, type, categoryId } = filter

		const { and, or, ilike, exists, notExists } = await import('drizzle-orm')

		const searchCondition = search
			? or(ilike(materialsTable.name, `%${search}%`), ilike(materialsTable.sku, `%${search}%`))
			: undefined

		const locationInclude =
			filter.locationIds && filter.locationIds.length > 0
				? exists(
						this.db
							.select({ _: materialLocationsTable.materialId })
							.from(materialLocationsTable)
							.where(
								and(
									eq(materialLocationsTable.materialId, materialsTable.id),
									inArray(materialLocationsTable.locationId, filter.locationIds),
								),
							),
					)
				: undefined

		const locationExclude =
			filter.excludeLocationIds && filter.excludeLocationIds.length > 0
				? notExists(
						this.db
							.select({ _: materialLocationsTable.materialId })
							.from(materialLocationsTable)
							.where(
								and(
									eq(materialLocationsTable.materialId, materialsTable.id),
									inArray(materialLocationsTable.locationId, filter.excludeLocationIds),
								),
							),
					)
				: undefined

		const where = and(
			searchCondition,
			type ? eq(materialsTable.type, type) : undefined,
			categoryId === undefined ? undefined : eq(materialsTable.categoryId, categoryId),
			locationInclude,
			locationExclude,
		)

		return paginate<any>({
			data: ({ limit, offset }) =>
				this.db
					.select()
					.from(materialsTable)
					.where(where)
					.orderBy(sortBy(materialsTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => this.db.select({ count: count() }).from(materialsTable).where(where),
		})
	}

	async count(): Promise<number> {
		return this.db
			.select({ count: count() })
			.from(materialsTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: MaterialInsertData): Promise<{ id: number }> {
		const metadata = stampCreate(data.createdBy)

		const [material] = await this.db
			.insert(materialsTable)
			.values({
				name: data.name,
				description: data.description,
				sku: data.sku,
				type: data.type,
				categoryId: data.categoryId,
				baseUomId: data.baseUomId,
				...metadata,
			})
			.returning({ id: materialsTable.id })

		if (!material) throw new Error('Material creation failed')
		return material
	}

	async update(id: number, data: MaterialUpdateData): Promise<{ id: number }> {
		const metadata = stampUpdate(data.updatedBy)

		await this.db
			.update(materialsTable)
			.set({
				name: data.name,
				description: data.description,
				sku: data.sku,
				type: data.type,
				categoryId: data.categoryId ?? undefined,
				baseUomId: data.baseUomId,
				...metadata,
			})
			.where(eq(materialsTable.id, id))

		return { id }
	}

	async remove(id: number): Promise<number | undefined> {
		const [res] = await this.db
			.delete(materialsTable)
			.where(eq(materialsTable.id, id))
			.returning({ id: materialsTable.id })

		return res?.id
	}
}
