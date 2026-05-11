import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, exists, ilike, inArray, notExists, or } from 'drizzle-orm'

import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import { materialConversionsTable, materialLocationsTable, materialsTable } from '@/db/schema'

import type { MaterialDto, MaterialFilterDto, MaterialMutationDto } from './material.dto'

export class MaterialRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getList(): Promise<MaterialDto[]> {
		return record('MaterialRepo.getList', async () => {
			return this.db.select().from(materialsTable).orderBy(materialsTable.name)
		})
	}

	async getById(id: number): Promise<MaterialDto | undefined> {
		return record('MaterialRepo.getById', async () => {
			const res = await this.db
				.select()
				.from(materialsTable)
				.where(eq(materialsTable.id, id))
				.then(takeFirst)
			return res
		})
	}

	async getByIds(ids: number[]): Promise<MaterialDto[]> {
		if (ids.length === 0) return []
		return record('MaterialRepo.getByIds', async () => {
			return this.db.select().from(materialsTable).where(inArray(materialsTable.id, ids))
		})
	}

	async count(): Promise<number> {
		return record('MaterialRepo.count', async () => {
			return this.db
				.select({ count: count() })
				.from(materialsTable)
				.then((rows) => rows[0]?.count ?? 0)
		})
	}

	async getListPaginated(filter: MaterialFilterDto): Promise<WithPaginationResult<MaterialDto>> {
		return record('MaterialRepo.getListPaginated', async () => {
			const { search, type, categoryId, locationIds, excludeLocationIds } = filter

			const searchCondition = search
				? or(ilike(materialsTable.name, `%${search}%`), ilike(materialsTable.sku, `%${search}%`))
				: undefined

			const locationInclude =
				locationIds && locationIds.length > 0
					? exists(
							this.db
								.select({ _: materialLocationsTable.materialId })
								.from(materialLocationsTable)
								.where(
									and(
										eq(materialLocationsTable.materialId, materialsTable.id),
										inArray(materialLocationsTable.locationId, locationIds),
									),
								),
						)
					: undefined

			const locationExclude =
				excludeLocationIds && excludeLocationIds.length > 0
					? notExists(
							this.db
								.select({ _: materialLocationsTable.materialId })
								.from(materialLocationsTable)
								.where(
									and(
										eq(materialLocationsTable.materialId, materialsTable.id),
										inArray(materialLocationsTable.locationId, excludeLocationIds),
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

			const result = await paginate({
				data: ({ limit, offset }) =>
					this.db
						.select()
						.from(materialsTable)
						.where(where)
						.orderBy(sortBy(materialsTable.updatedAt, 'desc'))
						.limit(limit)
						.offset(offset),
				pq: filter,
				countQuery: this.db.select({ count: count() }).from(materialsTable).where(where),
			})

			console.log(result)

			return result
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: MaterialMutationDto & { createdBy: number }): Promise<{ id: number }> {
		return record('MaterialRepo.create', async () => {
			const metadata = stampCreate(data.createdBy)
			const { conversions, ...materialData } = data

			const inserted = await this.db.transaction(async (tx) => {
				const [material] = await tx
					.insert(materialsTable)
					.values({
						...materialData,
						...metadata,
					})
					.returning({ id: materialsTable.id })

				if (material && conversions && conversions.length > 0) {
					const uniqueConversions = Array.from(
						new Map(conversions.map((c) => [c.uomId, c])).values(),
					)
					await tx.insert(materialConversionsTable).values(
						uniqueConversions.map((c) => ({
							materialId: material.id,
							uomId: c.uomId,
							toBaseFactor: c.toBaseFactor.toString(),
							...metadata,
						})),
					)
				}

				return material
			})

			if (!inserted) throw new Error('Material creation failed')

			return inserted
		})
	}

	async update(
		id: number,
		data: Partial<MaterialMutationDto> & { updatedBy: number },
	): Promise<{ id: number }> {
		return record('MaterialRepo.update', async () => {
			const metadata = stampUpdate(data.updatedBy)
			const createMetadata = stampCreate(data.updatedBy)
			const { conversions, ...updateData } = data

			await this.db.transaction(async (tx) => {
				await tx
					.update(materialsTable)
					.set({ ...updateData, ...metadata })
					.where(eq(materialsTable.id, id))

				if (conversions !== undefined) {
					await tx
						.delete(materialConversionsTable)
						.where(eq(materialConversionsTable.materialId, id))

					if (conversions.length > 0) {
						const uniqueConversions = Array.from(
							new Map(conversions.map((c) => [c.uomId, c])).values(),
						)
						await tx.insert(materialConversionsTable).values(
							uniqueConversions.map((c) => ({
								materialId: id,
								uomId: c.uomId,
								toBaseFactor: c.toBaseFactor.toString(),
								...createMetadata,
							})),
						)
					}
				}
			})

			return { id }
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('MaterialRepo.remove', async () => {
			const [res] = await this.db
				.delete(materialsTable)
				.where(eq(materialsTable.id, id))
				.returning({ id: materialsTable.id })

			return res?.id
		})
	}
}
