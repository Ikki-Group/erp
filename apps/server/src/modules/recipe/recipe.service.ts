import { stockBalances } from '@/db/schema/inventory.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { eq, and } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'
import { NotFoundError } from '@/shared/errors/http-error.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { MaterialService } from '@/modules/material/material.service.ts'
import type { MenuItemDto } from '@/modules/menu/item/item.contract.ts'
import { resolveConversion } from '@/modules/uom/domain/uom.resolver.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import type {
	HppResponseDto,
	RecipeCreateDto,
	RecipeDetailDto,
	RecipeDto,
	RecipeFilterDto,
	RecipeLineDto,
	RecipeUpdateDto,
} from './recipe.contract.ts'
import { RecipeError } from './recipe.internal.ts'
import type { IRecipeRepo } from './recipe.repo.ts'

// ─── Service ───

export class RecipeService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IRecipeRepo,
		cacheClient: CacheClient,
		private readonly materialService: MaterialService,
		private readonly uomService: UomService,
		private readonly itemGetById: (id: number, actor: Actor) => Promise<MenuItemDto>,
		private readonly uow: UnitOfWork,
		private readonly audit: AuditPort,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'recipe')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<RecipeDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async getActiveByMenuItemId(menuItemId: number, db?: DbContext): Promise<RecipeDto | undefined> {
		if (db) return this.repo.findActiveByMenuItemId(menuItemId, db)
		return this.cache.getOrSetWithSkip({
			key: `recipe:byMenuItemId:${menuItemId}`,
			factory: () => this.repo.findActiveByMenuItemId(menuItemId),
		})
	}

	async getLinesByRecipeId(recipeId: number, db?: DbContext): Promise<RecipeLineDto[]> {
		return this.repo.findLinesByRecipeId(recipeId, db)
	}

	// ─── Handlers ───

	/** Loads the recipe and asserts the actor may act at its menu item's location. */
	async handleGetById(id: number, actor: Actor): Promise<RecipeDto> {
		const recipe = assertFound(await this.getById(id), () => RecipeError.notFound(id))
		await this.itemGetById(recipe.menuItemId, actor)
		return recipe
	}

	async handleDetail(id: number, actor: Actor): Promise<RecipeDetailDto> {
		const recipe = await this.handleGetById(id, actor)
		const lines = await this.repo.findLinesByRecipeId(id)
		const enrichedLines = await this.enrichLines(lines)
		return { ...recipe, lines: enrichedLines }
	}

	async handleDetailByMenuItem(menuItemId: number, actor: Actor): Promise<RecipeDetailDto> {
		await this.requireMenuItem(menuItemId, actor)
		const recipe = await this.getActiveByMenuItemId(menuItemId)
		if (!recipe) throw RecipeError.activeNotFound(menuItemId)
		const lines = await this.repo.findLinesByRecipeId(recipe.id)
		const enrichedLines = await this.enrichLines(lines)
		return { ...recipe, lines: enrichedLines }
	}

	async handleList(
		filter: RecipeFilterDto,
		actor: Actor,
	): Promise<WithPaginationResult<RecipeDto>> {
		return this.repo.findPage(filter, actor.allowedLocations())
	}

	async handleCreate(data: RecipeCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate menu item exists and is writable by the actor
		await this.requireMenuItem(data.menuItemId, actor)

		// 2. Validate lines
		await this.validateLines(data.lines)

		// 3. Write recipe, lines, and audit in one transaction
		const result = await this.uow.run(async (tx) => {
			await this.repo.deactivateByMenuItemId(data.menuItemId, tx)

			const written = await this.repo.insert(
				{
					menuItemId: data.menuItemId,
					name: data.name,
					yieldQty: data.yieldQty,
					isActive: true,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!written) throw RecipeError.createFailed()

			await this.repo.replaceLines(
				written.id,
				data.lines.map((line) => ({
					materialId: line.materialId,
					quantity: line.quantity,
					uomId: line.uomId,
				})),
				tx,
			)

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'recipe',
					entity: 'recipe',
					entityId: written.id,
					action: 'create',
					summary: `Created recipe "${data.name}" for menu item #${data.menuItemId}`,
					newValues: {
						name: data.name,
						menuItemId: data.menuItemId,
						yieldQty: data.yieldQty,
						linesCount: data.lines.length,
					},
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard()
		await this.invalidateMenuItemCache(data.menuItemId)
		return result
	}

	async handleUpdate(data: RecipeUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify recipe exists
		const existing = await this.handleGetById(id, actor)

		// 2. Validate lines
		await this.validateLines(updateData.lines)

		// 3. Update recipe, lines, and audit in one transaction
		const result = await this.uow.run(async (tx) => {
			const written = await this.repo.update(
				id,
				{
					name: updateData.name,
					yieldQty: updateData.yieldQty,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw RecipeError.updateFailed(id)

			await this.repo.replaceLines(
				id,
				updateData.lines.map((line) => ({
					materialId: line.materialId,
					quantity: line.quantity,
					uomId: line.uomId,
				})),
				tx,
			)

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'recipe',
					entity: 'recipe',
					entityId: id,
					action: 'update',
					summary: `Updated recipe "${updateData.name}"`,
					newValues: {
						name: updateData.name,
						yieldQty: updateData.yieldQty,
						linesCount: updateData.lines.length,
					},
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard(id)
		await this.invalidateMenuItemCache(existing.menuItemId)
		return result
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		// 1. Verify recipe exists
		const existing = await this.handleGetById(id, actor)

		// 2. Delete and audit in one transaction
		const result = await this.uow.run(async (tx) => {
			const written = await this.repo.remove(id, tx)
			if (!written) throw RecipeError.deleteFailed(id)

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'recipe',
					entity: 'recipe',
					entityId: id,
					action: 'delete',
					summary: `Deleted recipe "${existing.name}"`,
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard(id)
		await this.invalidateMenuItemCache(existing.menuItemId)
		return result
	}

	async handleCalculateHpp(
		menuItemId: number,
		locationId: number,
		actor: Actor,
	): Promise<HppResponseDto> {
		await this.requireMenuItem(menuItemId, actor)

		// 1. Get active recipe
		const recipe = await this.getActiveByMenuItemId(menuItemId)
		if (!recipe) throw RecipeError.activeNotFound(menuItemId)

		// 2. Get lines
		const lines = await this.repo.findLinesByRecipeId(recipe.id)

		// 3. Get all conversions for UoM resolution
		const conversions = await this.uomService.getAllConversions()

		// 4. Calculate cost per line
		const breakdown: HppResponseDto['breakdown'] = []
		let totalCost = Money.zero()

		for (const line of lines) {
			// Get material for base UoM and name
			const material = await this.materialService.getById(line.materialId)
			if (!material) {
				breakdown.push({
					materialId: line.materialId,
					materialName: `Unknown Material #${line.materialId}`,
					quantity: line.quantity,
					uomCode: '',
					unitCost: '0',
					lineCost: '0',
				})
				continue
			}

			// Get UoM code
			const uom = await this.uomService.getById(line.uomId)
			const uomCode = uom?.code ?? ''

			// Get cost price from stock_balances
			const costPrice = await this.getCostPrice(line.materialId, locationId)

			// Convert quantity to material base UoM
			let convertedQty = Qty.of(line.quantity)
			if (line.uomId !== material.baseUomId) {
				const conversion = resolveConversion(
					line.uomId,
					material.baseUomId,
					Qty.of(line.quantity),
					conversions,
				)
				if (conversion) convertedQty = conversion.result
				// If no conversion path, use raw quantity (best effort)
			}

			const lineCost = Money.of(costPrice).mul(convertedQty)
			totalCost = totalCost.add(lineCost)

			breakdown.push({
				materialId: line.materialId,
				materialName: material.name,
				quantity: line.quantity,
				uomCode,
				unitCost: costPrice,
				lineCost: lineCost.toCost(),
			})
		}

		// 5. Divide by yield qty
		const yieldQty = Qty.of(recipe.yieldQty)
		const hpp = yieldQty.isZero() ? '0.0000' : totalCost.div(yieldQty).toCost()

		return {
			menuItemId,
			locationId,
			hpp,
			breakdown,
		}
	}

	// ─── Private ───

	private async requireMenuItem(menuItemId: number, actor: Actor): Promise<MenuItemDto> {
		try {
			return await this.itemGetById(menuItemId, actor)
		} catch (error) {
			if (error instanceof NotFoundError) throw RecipeError.menuItemNotFound(menuItemId)
			throw error
		}
	}

	private async validateLines(
		lines: { materialId: number; quantity: string; uomId: number }[],
	): Promise<void> {
		const conversions = await this.uomService.getAllConversions()

		for (const line of lines) {
			// Validate material exists
			const material = await this.materialService.getById(line.materialId)
			if (!material) throw RecipeError.materialNotFound(line.materialId)

			// Validate UoM exists
			await this.uomService.handleGetById(line.uomId)

			// Validate UoM is convertible to material base UoM
			if (line.uomId !== material.baseUomId) {
				const conversion = resolveConversion(
					line.uomId,
					material.baseUomId,
					Qty.of('1'),
					conversions,
				)
				if (!conversion) {
					throw RecipeError.uomNotConvertible(line.uomId, material.baseUomId)
				}
			}
		}
	}

	private async enrichLines(lines: RecipeLineDto[]): Promise<RecipeDetailDto['lines']> {
		if (lines.length === 0) return []

		// Batch fetch materials
		const materialIds = [...new Set(lines.map((l) => l.materialId))]
		const materials = await this.materialService.getByIds(materialIds)
		const materialMap = new Map(materials.map((m) => [m.id, m]))

		// Batch fetch UoMs
		const uomIds = [...new Set(lines.map((l) => l.uomId))]
		const uomPromises = uomIds.map(async (id) => {
			const uom = await this.uomService.getById(id)
			return [id, uom] as const
		})
		const uomEntries = await Promise.all(uomPromises)
		const uomMap = new Map(uomEntries.map(([id, uom]) => [id, uom]))

		return lines.map((line) => ({
			...line,
			materialName: materialMap.get(line.materialId)?.name ?? '',
			uomCode: uomMap.get(line.uomId)?.code ?? '',
		}))
	}

	private async getCostPrice(materialId: number, locationId: number): Promise<string> {
		const row = await this.repo.db
			.select({ costPrice: stockBalances.costPrice })
			.from(stockBalances)
			.where(
				and(eq(stockBalances.materialId, materialId), eq(stockBalances.locationId, locationId)),
			)
			.limit(1)
			.then((rows) => rows[0])
		return row?.costPrice ?? '0'
	}

	private async invalidateMenuItemCache(menuItemId: number): Promise<void> {
		await this.cache.deleteFromKeys([`recipe:byMenuItemId:${menuItemId}`])
	}
}
