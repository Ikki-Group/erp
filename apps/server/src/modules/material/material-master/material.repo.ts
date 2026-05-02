/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, inArray, isNull, or } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type WithPaginationResult,
} from '@/core/database'

import { db } from '@/db'
import { materialConversionsTable, materialsTable } from '@/db/schema'

import type {
	MaterialDto,
	MaterialFilterDto,
	MaterialMutationDto,
	MaterialSelectDto,
} from './material.dto'

const cache = bento.namespace('material')

/* ---------------------------------- QUERY --------------------------------- */

export class MaterialRepo {
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		return record('MaterialRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await cache.deleteMany({ keys })
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getList(): Promise<MaterialDto[]> {
		return record('MaterialRepo.getList', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () =>
					db
						.select()
						.from(materialsTable)
						.where(isNull(materialsTable.deletedAt))
						.orderBy(materialsTable.name) as unknown as MaterialDto[],
			})
		})
	}

	async getById(id: number): Promise<MaterialDto | null> {
		return record('MaterialRepo.getById', async () => {
			const result = await cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = (await db
						.select()
						.from(materialsTable)
						.where(and(eq(materialsTable.id, id), isNull(materialsTable.deletedAt)))
						.then(takeFirst)) as unknown as MaterialDto | null
					return res ?? skip()
				},
			})
			return result ?? null
		})
	}

	async getByIds(ids: number[]): Promise<MaterialDto[]> {
		if (ids.length === 0) return []
		return record('MaterialRepo.getByIds', async () => {
			return db
				.select()
				.from(materialsTable)
				.where(
					and(inArray(materialsTable.id, ids), isNull(materialsTable.deletedAt)),
				) as unknown as MaterialDto[]
		})
	}

	async count(): Promise<number> {
		return record('MaterialRepo.count', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.count,
				factory: async () =>
					db
						.select({ count: count() })
						.from(materialsTable)
						.where(isNull(materialsTable.deletedAt))
						.then((rows) => rows[0]?.count ?? 0),
			})
		})
	}

	async getListPaginated(
		filter: MaterialFilterDto,
	): Promise<WithPaginationResult<MaterialSelectDto>> {
		return record('MaterialRepo.getListPaginated', async () => {
			const { search, type, categoryId } = filter

			const searchCondition = search
				? or(ilike(materialsTable.name, `%${search}%`), ilike(materialsTable.sku, `%${search}%`))
				: undefined

			const where = and(
				isNull(materialsTable.deletedAt),
				searchCondition,
				type ? eq(materialsTable.type, type) : undefined,
				categoryId === undefined ? undefined : eq(materialsTable.categoryId, categoryId),
			)

			const result = await paginate({
				data: ({ limit, offset }) =>
					db
						.select()
						.from(materialsTable)
						.where(where)
						.orderBy(sortBy(materialsTable.updatedAt, 'desc'))
						.limit(limit)
						.offset(offset),
				pq: filter,
				countQuery: db.select({ count: count() }).from(materialsTable).where(where),
			})

			const data: MaterialSelectDto[] = result.data.map((m) => {
				const dto: MaterialSelectDto = {
					...m,
					uom: null, // Populated by service
					category: null, // Populated by service
					conversions: [],
					locationIds: [],
					creator: null,
					updater: null,
				}
				return dto
			})

			return { data, meta: result.meta }
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: MaterialMutationDto & { createdBy: number }): Promise<{ id: number }> {
		return record('MaterialRepo.create', async () => {
			const metadata = stampCreate(data.createdBy)
			const { conversions, ...materialData } = data

			const inserted = await db.transaction(async (tx) => {
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

			void this.#clearCache()
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

			await db.transaction(async (tx) => {
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

			void this.#clearCache(id)
			return { id }
		})
	}

	async softDelete(id: number, deletedBy: number): Promise<{ id: number }> {
		return record('MaterialRepo.softDelete', async () => {
			const timestamp = new Date()

			await db.transaction(async (tx) => {
				await Promise.all([
					tx
						.update(materialConversionsTable)
						.set({ deletedAt: timestamp, deletedBy })
						.where(eq(materialConversionsTable.materialId, id)),
				])

				await tx
					.update(materialsTable)
					.set({ deletedAt: timestamp, deletedBy })
					.where(eq(materialsTable.id, id))
			})

			void this.#clearCache(id)
			return { id }
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('MaterialRepo.hardDelete', async () => {
			const result = await db
				.delete(materialsTable)
				.where(eq(materialsTable.id, id))
				.returning({ id: materialsTable.id })

			if (result.length === 0) throw new Error(`Material ${id} not found`)

			void this.#clearCache(id)
			return result[0] as { id: number }
		})
	}
}
