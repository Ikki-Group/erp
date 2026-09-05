import { materials } from '@/db/schema/material.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import { resolveConversion } from '@/modules/uom/uom.resolver.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import type { CategoryService } from './category/category.service.ts'
import type {
	MaterialCreateDto,
	MaterialDto,
	MaterialFilterDto,
	MaterialUpdateDto,
} from './material.contract.ts'
import { MaterialError, uniqueFields } from './material.internal.ts'
import type { IMaterialRepo } from './material.repo.ts'

// ─── Service ───

export class MaterialService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IMaterialRepo,
		cacheClient: CacheClient,
		private readonly uomService: UomService,
		private readonly categoryService: CategoryService,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'material')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<MaterialDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async getByIds(ids: number[]): Promise<MaterialDto[]> {
		return this.repo.findByIds(ids)
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<MaterialDto> {
		return assertFound(await this.getById(id), () => MaterialError.notFound(id))
	}

	async handleList(filter: MaterialFilterDto): Promise<WithPaginationResult<MaterialDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: MaterialCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate category exists (if provided)
		if (data.categoryId) {
			await this.categoryService.handleGetById(data.categoryId)
		}

		// 2. Validate base UoM exists
		await this.uomService.handleGetById(data.baseUomId)

		// 3. Validate default UoMs convertible to base
		await this.validateDefaultUoms(data.baseUomId, {
			purchaseUomId: data.defaultPurchaseUomId,
			stockUomId: data.defaultStockUomId,
			recipeUomId: data.defaultRecipeUomId,
		})

		// 4. Check conflicts (code unique)
		await checkConflict({
			db: this.repo.db,
			table: materials,
			pkColumn: materials.id,
			fields: uniqueFields,
			input: data,
		})

		// 5. Insert
		const result = await this.repo.insert({
			...data,
			isActive: data.isActive,
			...stampCreate(actorId),
		})
		if (!result) throw MaterialError.createFailed()

		// 6. Invalidate cache
		await this.cache.invalidateStandard()

		// 7. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'material',
			entity: 'material',
			entityId: result.id,
			action: 'create',
			summary: `Created material "${data.name}" (${data.code})`,
			newValues: { code: data.code, name: data.name, type: data.type },
		})

		return result
	}

	async handleUpdate(data: MaterialUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		await this.handleGetById(id)

		// 2. Validate category exists (if provided)
		if (updateData.categoryId) {
			await this.categoryService.handleGetById(updateData.categoryId)
		}

		// 3. Validate base UoM exists
		await this.uomService.handleGetById(updateData.baseUomId)

		// 4. Validate default UoMs convertible to base
		await this.validateDefaultUoms(updateData.baseUomId, {
			purchaseUomId: updateData.defaultPurchaseUomId,
			stockUomId: updateData.defaultStockUomId,
			recipeUomId: updateData.defaultRecipeUomId,
		})

		// 5. Check conflicts (exclude self)
		await checkConflict({
			db: this.repo.db,
			table: materials,
			pkColumn: materials.id,
			fields: uniqueFields,
			input: updateData,
			excludeId: id,
		})

		// 6. Update
		const result = await this.repo.update(id, {
			...updateData,
			isActive: updateData.isActive,
			...stampUpdate(actorId),
		})
		if (!result) throw MaterialError.updateFailed(id)

		// 7. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 8. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'material',
			entity: 'material',
			entityId: id,
			action: 'update',
			summary: `Updated material "${data.name}" (${data.code})`,
			newValues: { code: data.code, name: data.name, type: data.type },
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Soft-delete
		const result = await this.repo.remove(id, stampUpdate(actorId))
		if (!result) throw MaterialError.deleteFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'material',
			entity: 'material',
			entityId: id,
			action: 'delete',
			summary: `Deleted material "${existing.name}" (${existing.code})`,
		})

		return result
	}

	// ─── Private ───

	/**
	 * Validates that each non-null default UoM is convertible to the base UoM.
	 * Uses the UoM resolver's BFS to check conversion path existence.
	 */
	private async validateDefaultUoms(
		baseUomId: number,
		uoms: {
			purchaseUomId?: number | null
			stockUomId?: number | null
			recipeUomId?: number | null
		},
	): Promise<void> {
		const conversions = await this.uomService.getAllConversions()

		const checks: { uomId: number; label: string }[] = []
		if (uoms.purchaseUomId) checks.push({ uomId: uoms.purchaseUomId, label: 'purchase' })
		if (uoms.stockUomId) checks.push({ uomId: uoms.stockUomId, label: 'stock' })
		if (uoms.recipeUomId) checks.push({ uomId: uoms.recipeUomId, label: 'recipe' })

		for (const check of checks) {
			// Validate the UoM itself exists
			await this.uomService.handleGetById(check.uomId)

			// Check conversion path to base
			const result = resolveConversion(check.uomId, baseUomId, '1', conversions)
			if (!result) {
				throw MaterialError.uomNotConvertible(check.uomId, baseUomId)
			}
		}
	}
}
