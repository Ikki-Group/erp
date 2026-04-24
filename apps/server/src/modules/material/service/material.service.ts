import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, exists, inArray, isNull, notExists, or, ilike } from 'drizzle-orm'

import { bento } from '@/core/cache'
import {
	checkConflict,
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	type ConflictField,
} from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import { resolveAudit, resolveAuditList } from '@/core/utils/audit-resolver'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'
import {
	materialConversionsTable,
	materialLocationsTable,
	materialsTable,
	uomsTable,
} from '@/db/schema'

import type { LocationMasterService } from '@/modules/location'

import type {
	MaterialCategoryDto,
	MaterialDto,
	MaterialFilterDto,
	MaterialMutationDto,
	MaterialSelectDto,
	UomDto,
} from '../dto'
import type { MaterialCategoryService } from './material-category.service'
import type { UomService } from './uom.service'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Material with ID ${id} not found`, 'MATERIAL_NOT_FOUND'),
	createFailed: () => new InternalServerError('Material creation failed', 'MATERIAL_CREATE_FAILED'),
}

const uniqueFields: ConflictField<'sku' | 'name'>[] = [
	{
		field: 'sku',
		column: materialsTable.sku,
		message: 'Material SKU already exists',
		code: 'MATERIAL_SKU_ALREADY_EXISTS',
	},
	{
		field: 'name',
		column: materialsTable.name,
		message: 'Material name already exists',
		code: 'MATERIAL_NAME_ALREADY_EXISTS',
	},
]

const cache = bento.namespace('material')

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class MaterialService {
	constructor(
		private readonly categorySvc: MaterialCategoryService,
		private readonly uomSvc: UomService,
		private readonly locationSvc: LocationMasterService,
	) {}

	/**
	 * Helper to fetch full material detail including conversions and locationIds
	 */
	private async getMaterialWithRelations(id: number): Promise<MaterialDto> {
		const [result] = await db
			.select()
			.from(materialsTable)
			.where(and(eq(materialsTable.id, id), isNull(materialsTable.deletedAt)))
			.limit(1)

		if (!result) throw err.notFound(id)

		const [conversions, locations] = await Promise.all([
			db
				.select({
					toBaseFactor: materialConversionsTable.toBaseFactor,
					uomId: materialConversionsTable.uomId,
					uom: uomsTable,
				})
				.from(materialConversionsTable)
				.innerJoin(uomsTable, eq(materialConversionsTable.uomId, uomsTable.id))
				.where(
					and(
						eq(materialConversionsTable.materialId, id),
						isNull(materialConversionsTable.deletedAt),
					),
				),

			db
				.select({ locationId: materialLocationsTable.locationId })
				.from(materialLocationsTable)
				.where(
					and(eq(materialLocationsTable.materialId, id), isNull(materialLocationsTable.deletedAt)),
				),
		])

		return {
			...result,
			conversions: conversions.map((c) => ({
				toBaseFactor: Number(c.toBaseFactor),
				uomId: c.uomId,
				uom: c.uom,
			})),
			locationIds: locations.map((l) => l.locationId),
		}
	}

	/**
	 * Batch fetch full material details including conversions and locationIds
	 */
	private async getMaterialsBatchWithRelations(
		ids: number[],
	): Promise<Map<number, { conversions: MaterialDto['conversions']; locationIds: number[] }>> {
		if (ids.length === 0)
			return new Map<number, { conversions: MaterialDto['conversions']; locationIds: number[] }>()

		const [conversions, locations] = await Promise.all([
			db
				.select({
					materialId: materialConversionsTable.materialId,
					toBaseFactor: materialConversionsTable.toBaseFactor,
					uomId: materialConversionsTable.uomId,
					uom: uomsTable,
				})
				.from(materialConversionsTable)
				.innerJoin(uomsTable, eq(materialConversionsTable.uomId, uomsTable.id))
				.where(
					and(
						inArray(materialConversionsTable.materialId, ids),
						isNull(materialConversionsTable.deletedAt),
					),
				),

			db
				.select({
					materialId: materialLocationsTable.materialId,
					locationId: materialLocationsTable.locationId,
				})
				.from(materialLocationsTable)
				.where(
					and(
						inArray(materialLocationsTable.materialId, ids),
						isNull(materialLocationsTable.deletedAt),
					),
				),
		])

		const map = new Map<
			number,
			{ conversions: MaterialDto['conversions']; locationIds: number[] }
		>()
		for (const id of ids) {
			map.set(id, { conversions: [], locationIds: [] })
		}

		for (const c of conversions) {
			map.get(c.materialId)!.conversions.push({
				toBaseFactor: Number(c.toBaseFactor),
				uomId: c.uomId,
				uom: c.uom,
			})
		}

		for (const l of locations) {
			map.get(l.materialId)!.locationIds.push(l.locationId)
		}

		return map
	}

	async find(): Promise<MaterialDto[]> {
		return record('MaterialService.find', async () => {
			return cache.getOrSet({
				key: 'list',
				factory: async () => {
					const rawMaterials = await db
						.select()
						.from(materialsTable)
						.where(isNull(materialsTable.deletedAt))
						.orderBy(materialsTable.name)
					const relationsMap = await this.getMaterialsBatchWithRelations(
						rawMaterials.map((m) => m.id),
					)

					return rawMaterials.map((m) =>
						Object.assign({}, m, {
							conversions: relationsMap.get(m.id)!.conversions,
							locationIds: relationsMap.get(m.id)!.locationIds,
						}),
					)
				},
			})
		})
	}

	async getById(id: number): Promise<MaterialDto> {
		return record('MaterialService.getById', async () => {
			return cache.getOrSet({
				key: `${id}`,
				factory: async () => {
					return this.getMaterialWithRelations(id)
				},
			})
		})
	}

	async count(): Promise<number> {
		return record('MaterialService.count', async () => {
			return cache.getOrSet({
				key: 'count',
				factory: async () => {
					const result = await db
						.select({ val: count() })
						.from(materialsTable)
						.where(isNull(materialsTable.deletedAt))
					return result[0]?.val ?? 0
				},
			})
		})
	}

	async handleList(
		filter: MaterialFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<MaterialSelectDto>> {
		return record('MaterialService.handleList', async () => {
			const { search, type, categoryId, locationIds, excludeLocationIds } = filter

			const searchCondition = search
				? or(ilike(materialsTable.name, `%${search}%`), ilike(materialsTable.sku, `%${search}%`))
				: undefined

			const locationCondition = locationIds?.length
				? exists(
						db
							.select()
							.from(materialLocationsTable)
							.where(
								and(
									eq(materialLocationsTable.materialId, materialsTable.id),
									inArray(materialLocationsTable.locationId, locationIds),
									isNull(materialLocationsTable.deletedAt),
								),
							),
					)
				: undefined

			const excludeLocationCondition = excludeLocationIds?.length
				? notExists(
						db
							.select()
							.from(materialLocationsTable)
							.where(
								and(
									eq(materialLocationsTable.materialId, materialsTable.id),
									inArray(materialLocationsTable.locationId, excludeLocationIds),
									isNull(materialLocationsTable.deletedAt),
								),
							),
					)
				: undefined

			const where = and(
				isNull(materialsTable.deletedAt),
				searchCondition,
				type ? eq(materialsTable.type, type) : undefined,
				categoryId === undefined ? undefined : eq(materialsTable.categoryId, categoryId),
				locationCondition,
				excludeLocationCondition,
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
				pq,
				countQuery: db.select({ count: count() }).from(materialsTable).where(where),
			})

			const materialIds = result.data.map((m) => m.id)
			const relationsMap = await this.getMaterialsBatchWithRelations(materialIds)

			const categoriesMap = new Map<number, MaterialCategoryDto>()
			const uomsMap = new Map<number, UomDto>()
			const [allCategories, allUoms] = await Promise.all([
				this.categorySvc.find(),
				this.uomSvc.find(),
			])

			for (const cat of allCategories) {
				categoriesMap.set(cat.id, cat)
			}
			for (const uom of allUoms) {
				uomsMap.set(uom.id, uom)
			}

			// @ts-expect-error
			const data: MaterialSelectDto[] = result.data.map((m) => {
				const relations = relationsMap.get(m.id)!
				return {
					...m,
					conversions: relations.conversions,
					locationIds: relations.locationIds,
					category: m.categoryId ? (categoriesMap.get(m.categoryId) ?? null) : null,
					uom: uomsMap.get(m.baseUomId) ?? null,
				}
			})

			const resolvedData = await resolveAuditList(data)

			return { data: resolvedData, meta: result.meta }
		})
	}

	async handleDetail(id: number): Promise<MaterialSelectDto> {
		// @ts-expect-error
		return record('MaterialService.handleDetail', async () => {
			const material = await this.getById(id)
			const [category, uom, locations] = await Promise.all([
				material.categoryId ? this.categorySvc.getById(material.categoryId) : null,
				this.uomSvc.getById(material.baseUomId).catch(() => null),
				material.locationIds.length > 0
					? Promise.all(material.locationIds.map((lId) => this.locationSvc.getById(lId)))
					: [],
			])

			return resolveAudit({ ...material, category, uom, locations })
		})
	}

	async handleCreate(data: MaterialMutationDto, actorId: number): Promise<{ id: number }> {
		return record('MaterialService.handleCreate', async () => {
			const sku = data.sku.trim()
			const name = data.name.trim()

			await checkConflict({
				table: materialsTable,
				pkColumn: materialsTable.id,
				fields: uniqueFields,
				input: { sku, name },
			})

			const metadata = stampCreate(actorId)

			const inserted = await db.transaction(async (tx) => {
				const [material] = await tx
					.insert(materialsTable)
					.values({ ...data, sku, name, ...metadata })
					.returning({ id: materialsTable.id })

				if (material && data.conversions?.length > 0) {
					const uniqueConversions = Array.from(
						new Map(data.conversions.map((c) => [c.uomId, c])).values(),
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

			if (!inserted) throw err.createFailed()

			await this.clearCache()
			return inserted
		})
	}

	async handleUpdate(
		id: number,
		data: MaterialMutationDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('MaterialService.handleUpdate', async () => {
			const existing = await this.getById(id)

			const sku = data.sku ? data.sku.trim() : existing.sku
			const name = data.name ? data.name.trim() : existing.name

			await checkConflict({
				table: materialsTable,
				pkColumn: materialsTable.id,
				fields: uniqueFields,
				input: { sku, name },
				existing,
			})

			const updateMetadata = stampUpdate(actorId)
			const createMetadata = stampCreate(actorId)

			await db.transaction(async (tx) => {
				await tx
					.update(materialsTable)
					.set({ ...data, sku, name, ...updateMetadata })
					.where(eq(materialsTable.id, id))

				if (data.conversions !== undefined) {
					// Hard delete conversions before re-inserting is standard for these relations
					// UNLESS there are child relations. Here there aren't.
					await tx
						.delete(materialConversionsTable)
						.where(eq(materialConversionsTable.materialId, id))
					if (data.conversions.length > 0) {
						const uniqueConversions = Array.from(
							new Map(data.conversions.map((c) => [c.uomId, c])).values(),
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

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Marks a material as deleted (Soft Delete).
	 */
	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('MaterialService.handleRemove', async () => {
			// Also soft delete its relations if needed?
			// Usually cascading soft delete is manual or handled by junction logic.
			// For conversions and locations, they are tied to this material.

			const result = await db.transaction(async (tx) => {
				const timestamp = new Date()

				await Promise.all([
					tx
						.update(materialConversionsTable)
						.set({ deletedAt: timestamp, deletedBy: actorId })
						.where(eq(materialConversionsTable.materialId, id)),
					tx
						.update(materialLocationsTable)
						.set({ deletedAt: timestamp, deletedBy: actorId })
						.where(eq(materialLocationsTable.materialId, id)),
				])

				return tx
					.update(materialsTable)
					.set({ deletedAt: timestamp, deletedBy: actorId })
					.where(eq(materialsTable.id, id))
					.returning({ id: materialsTable.id })
			})

			if (result.length === 0) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Permanently deletes a material (Hard Delete).
	 * USE WITH CAUTION.
	 */
	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('MaterialService.handleHardRemove', async () => {
			// Drizzle references handle the cascade if configured in schema (materialId references onDelete cascade)
			const result = await db
				.delete(materialsTable)
				.where(eq(materialsTable.id, id))
				.returning({ id: materialsTable.id })
			if (result.length === 0) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Clears relevant material caches.
	 */
	private async clearCache(id?: number) {
		const keys = ['count', 'list']
		if (id) keys.push(`${id}`)
		await cache.deleteMany({ keys })
	}
}
