import { record } from '@elysiajs/opentelemetry'
import { and, eq, inArray, isNull } from 'drizzle-orm'

import { bento } from '@/core/cache'
import { checkConflict, type ConflictField } from '@/core/database'
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
import { MaterialLocationRepo, MaterialRepo } from '../repo'
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
		private readonly materialRepo = new MaterialRepo(),
		private readonly materialLocationRepo = new MaterialLocationRepo(),
		private readonly categorySvc: MaterialCategoryService,
		private readonly uomSvc: UomService,
		private readonly locationSvc: LocationMasterService,
	) {}

	/**
	 * Helper to fetch full material detail including conversions and locationIds
	 */
	private async getMaterialWithRelations(id: number): Promise<MaterialDto> {
		const result = await this.materialRepo.getById(id)
		if (!result) throw err.notFound(id)

		const [conversions, locations] = await Promise.all([
			db
				.select({
					toBaseFactor: materialConversionsTable.toBaseFactor,
					uomId: materialConversionsTable.uomId,
				})
				.from(materialConversionsTable)
				.where(
					and(
						eq(materialConversionsTable.materialId, id),
						isNull(materialConversionsTable.deletedAt),
					),
				),

			this.materialLocationRepo.getByMaterialId(id),
		])

		const uomIds = conversions.map((c) => c.uomId)
		const uoms =
			uomIds.length > 0
				? await db.select().from(uomsTable).where(inArray(uomsTable.id, uomIds))
				: []
		const uomMap = new Map(uoms.map((u) => [u.id, u]))

		return {
			...result,
			conversions: conversions.map((c) => ({
				toBaseFactor: Number(c.toBaseFactor),
				uomId: c.uomId,
				uom: uomMap.get(c.uomId) ?? null,
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
				})
				.from(materialConversionsTable)
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

		// Fetch UOMs in batch
		const uomIds = conversions.map((c) => c.uomId)
		const uoms =
			uomIds.length > 0
				? await db.select().from(uomsTable).where(inArray(uomsTable.id, uomIds))
				: []
		const uomMap = new Map(uoms.map((u) => [u.id, u]))

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
				uom: uomMap.get(c.uomId),
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
					const rawMaterials = await this.materialRepo.getList()
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
					return this.materialRepo.count()
				},
			})
		})
	}

	async handleList(
		filter: MaterialFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<MaterialSelectDto>> {
		return record('MaterialService.handleList', async () => {
			const result = await this.materialRepo.getListPaginated({
				...filter,
				...pq,
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

			const created = await this.materialRepo.create({
				...data,
				sku,
				name,
				createdBy: actorId,
				updatedBy: actorId,
			})

			await this.clearCache()
			return created
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

			const updated = await this.materialRepo.update(id, {
				...data,
				sku,
				name,
				updatedBy: actorId,
			})

			await this.clearCache(id)
			return updated
		})
	}

	/**
	 * Marks a material as deleted (Soft Delete).
	 */
	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('MaterialService.handleRemove', async () => {
			const result = await this.materialRepo.softDelete(id, actorId)
			await this.clearCache(id)
			return result
		})
	}

	/**
	 * Permanently deletes a material (Hard Delete).
	 * USE WITH CAUTION.
	 */
	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('MaterialService.handleHardRemove', async () => {
			const result = await this.materialRepo.hardDelete(id)
			await this.clearCache(id)
			return result
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
