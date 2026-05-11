import { record } from '@elysiajs/opentelemetry'
import { and, inArray } from 'drizzle-orm'

import { resolveAudit } from '@/core/audit'
import { CacheService, type CacheClient } from '@/core/cache'
import { checkConflict, type ConflictField } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'

import { db } from '@/db'
import {
	materialConversionsTable,
	materialLocationsTable,
	materialsTable,
	uomsTable,
} from '@/db/schema'

import { LocationMasterService } from '@/modules/location'

import { MaterialCategoryService } from '../material-category/material-category.service'
import { UomService } from '../uom/uom.service'
import { MaterialDetailDto, MaterialDto, MaterialMutationDto } from './material.dto'
import { MaterialRepo } from './material.repo'
import type { RecordId } from '@ikki/api-contract'

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

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class MaterialService {
	private readonly cache: CacheService

	constructor(
		private readonly categorySvc: MaterialCategoryService,
		private readonly uomSvc: UomService,
		private readonly locationSvc: LocationMasterService,
		private readonly repo: MaterialRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'material', client: cacheClient })
	}

	/* --------------------------------- PRIVATE -------------------------------- */

	/**
	 * Batch fetch full material details including conversions and locationIds
	 */
	async getMaterialsBatchWithRelations(
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
				.where(and(inArray(materialConversionsTable.materialId, ids))),

			db
				.select({
					materialId: materialLocationsTable.materialId,
					locationId: materialLocationsTable.locationId,
				})
				.from(materialLocationsTable)
				.where(and(inArray(materialLocationsTable.materialId, ids))),
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
				toBaseFactor: c.toBaseFactor,
				uomId: c.uomId,
				uom: uomMap.get(c.uomId),
			})
		}

		for (const l of locations) {
			map.get(l.materialId)!.locationIds.push(l.locationId)
		}

		return map
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async find(): Promise<MaterialDto[]> {
		return record('MaterialService.find', async () => {
			const rawMaterials = await this.cache.getOrSet({
				key: 'list',
				factory: () => this.repo.getList(),
			})
			const relationsMap = await this.getMaterialsBatchWithRelations(rawMaterials.map((m) => m.id))

			return rawMaterials.map((m) =>
				Object.assign({}, m, {
					conversions: relationsMap.get(m.id)!.conversions,
					locationIds: relationsMap.get(m.id)!.locationIds,
				}),
			)
		})
	}

	async getById(id: number): Promise<MaterialDto | undefined> {
		return record('MaterialService.getById', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: async () => this.repo.getById(id),
			})
		})
	}

	async getDetailById(id: number): Promise<MaterialDetailDto | undefined> {
		return record('MaterialService.getDetailById', async () => {
			const material = await this.getById(id)
			if (!material) return undefined

			const uomMap = await this.uomSvc.getRelationMap()
			const categoryMap = await this.categorySvc.getRelationMap()

			const result: MaterialDetailDto = {
				...material,
				category: material.categoryId ? categoryMap.getRequired(material.categoryId) : null,
				// conversions: material..map((c) => ({
				// 	...c,
				// 	uom: c.uomId ? uomMap.getRequired(c.uomId) : null,
				// })),
				conversions: [],
			}

			return result
		})
	}

	async count(): Promise<number> {
		return record('MaterialService.count', async () => {
			return this.cache.getOrSet({
				key: 'count',
				factory: () => this.repo.count(),
			})
		})
	}

	async handleCreate(data: MaterialMutationDto, actorId: number): Promise<RecordId> {
		return record('MaterialService.handleCreate', async () => {
			const { sku, name } = data

			await checkConflict({
				table: materialsTable,
				pkColumn: materialsTable.id,
				fields: uniqueFields,
				input: { sku, name },
			})

			const created = await this.repo.create({
				...data,
				sku,
				name,
				createdBy: actorId,
			})

			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return created
		})
	}

	async handleUpdate(id: number, data: MaterialMutationDto, actorId: number): Promise<RecordId> {
		return record('MaterialService.handleUpdate', async () => {
			const { sku, name } = data

			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			await checkConflict({
				table: materialsTable,
				pkColumn: materialsTable.id,
				fields: uniqueFields,
				input: { sku, name },
				existing,
			})

			const updated = await this.repo.update(id, {
				...data,
				sku,
				name,
				updatedBy: actorId,
			})

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return updated
		})
	}

	async handleRemove(id: number): Promise<RecordId> {
		return record('MaterialService.handleRemove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw err.notFound(id)

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

			return { id: result }
		})
	}
}
