import { materials } from '@/db/schema/material.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound } from '@/shared/utils/index.ts'

import { resolveConversion } from '@/modules/uom/domain/uom.resolver.ts'
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

export interface MaterialServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
}

export class MaterialService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IMaterialRepo,
		cacheClient: CacheClient,
		private readonly uomService: UomService,
		private readonly categoryService: CategoryService,
		private readonly deps: MaterialServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'material')
	}

	// ─── Cached Reads ───

	async getById(id: number, db?: DbContext): Promise<MaterialDto | undefined> {
		if (db) return this.repo.findById(id, db)
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async getByIds(ids: number[], db?: DbContext): Promise<MaterialDto[]> {
		return this.repo.findByIds(ids, db)
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<MaterialDto> {
		return assertFound(await this.getById(id), () => MaterialError.notFound(id))
	}

	async handleList(filter: MaterialFilterDto): Promise<WithPaginationResult<MaterialDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: MaterialCreateDto, actor: Actor): Promise<EntityRef> {
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

		const result = await this.deps.uow.run(async (tx) => {
			// 4. Check conflicts (code unique)
			await checkConflict({
				db: tx,
				table: materials,
				pkColumn: materials.id,
				fields: uniqueFields,
				input: data,
			})

			// 5. Insert
			const written = await this.repo.insert(
				{
					...data,
					isActive: data.isActive,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!written) throw MaterialError.createFailed()

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'material',
					entity: 'material',
					entityId: written.id,
					action: 'create',
					summary: `Created material "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name, type: data.type },
				}),
				tx,
			)
			return written
		})

		// 6. Invalidate cache after commit
		await this.cache.invalidateStandard()
		return result
	}

	async handleUpdate(data: MaterialUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Validate category exists (if provided)
		if (updateData.categoryId) {
			await this.categoryService.handleGetById(updateData.categoryId)
		}

		// 2. Validate base UoM exists
		await this.uomService.handleGetById(updateData.baseUomId)

		// 3. Validate default UoMs convertible to base
		await this.validateDefaultUoms(updateData.baseUomId, {
			purchaseUomId: updateData.defaultPurchaseUomId,
			stockUomId: updateData.defaultStockUomId,
			recipeUomId: updateData.defaultRecipeUomId,
		})

		const result = await this.deps.uow.run(async (tx) => {
			// 4. Verify exists
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw MaterialError.notFound(id)

			// 5. Check conflicts (exclude self)
			await checkConflict({
				db: tx,
				table: materials,
				pkColumn: materials.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			// 6. Update
			const written = await this.repo.update(
				id,
				{
					...updateData,
					isActive: updateData.isActive,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw MaterialError.updateFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'material',
					entity: 'material',
					entityId: id,
					action: 'update',
					summary: `Updated material "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name, type: data.type },
				}),
				tx,
			)
			return written
		})

		// 7. Invalidate cache after commit
		await this.cache.invalidateStandard(id)
		return result
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Verify exists
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw MaterialError.notFound(id)

			// 2. Soft-delete
			const written = await this.repo.remove(id, stampUpdate(actor.id), tx)
			if (!written) throw MaterialError.deleteFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'material',
					entity: 'material',
					entityId: id,
					action: 'delete',
					summary: `Deleted material "${existing.name}" (${existing.code})`,
				}),
				tx,
			)
			return written
		})

		// 3. Invalidate cache after commit
		await this.cache.invalidateStandard(id)
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
			const result = resolveConversion(check.uomId, baseUomId, Qty.of('1'), conversions)
			if (!result) {
				throw MaterialError.uomNotConvertible(check.uomId, baseUomId)
			}
		}
	}
}
