import { stockBalances } from '@/db/schema/inventory.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { eq, and } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'
import { roundCost, safeDivide, toDecimal } from '@/shared/utils/money.ts'

import type { MaterialService } from '@/modules/material/material.service.ts'
import type { ItemService } from '@/modules/menu/item/item.service.ts'
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
		private readonly itemService: ItemService,
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

	async getActiveByMenuItemId(menuItemId: number): Promise<RecipeDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: `recipe:byMenuItemId:${menuItemId}`,
			factory: () => this.repo.findActiveByMenuItemId(menuItemId),
		})
	}

	async getLinesByRecipeId(recipeId: number): Promise<RecipeLineDto[]> {
		return this.repo.findLinesByRecipeId(recipeId)
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<RecipeDto> {
		return assertFound(await this.getById(id), () => RecipeError.notFound(id))
	}

	async handleDetail(id: number): Promise<RecipeDetailDto> {
		const recipe = await this.handleGetById(id)
		const lines = await this.repo.findLinesByRecipeId(id)
		const enrichedLines = await this.enrichLines(lines)
		return { ...recipe, lines: enrichedLines }
	}

	async handleDetailByMenuItem(menuItemId: number): Promise<RecipeDetailDto> {
		const recipe = await this.getActiveByMenuItemId(menuItemId)
		if (!recipe) throw RecipeError.activeNotFound(menuItemId)
		const lines = await this.repo.findLinesByRecipeId(recipe.id)
		const enrichedLines = await this.enrichLines(lines)
		return { ...recipe, lines: enrichedLines }
	}

	async handleList(filter: RecipeFilterDto): Promise<WithPaginationResult<RecipeDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: RecipeCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate menu item exists
		await this.itemService.handleGetById(data.menuItemId).catch(() => {
			throw RecipeError.menuItemNotFound(data.menuItemId)
		})

		// 2. Validate lines
		await this.validateLines(data.lines)

		// 3. Deactivate existing active recipe for this menu item
		await this.repo.deactivateByMenuItemId(data.menuItemId)

		// 4. Insert recipe
		const result = await this.repo.insert({
			menuItemId: data.menuItemId,
			name: data.name,
			yieldQty: data.yieldQty,
			isActive: true,
			...stampCreate(actorId),
		})
		if (!result) throw RecipeError.createFailed()

		// 5. Insert lines
		await this.repo.replaceLines(
			result.id,
			data.lines.map((line) => ({
				materialId: line.materialId,
				quantity: line.quantity,
				uomId: line.uomId,
			})),
		)

		// 6. Invalidate cache
		await this.cache.invalidateStandard()
		await this.invalidateMenuItemCache(data.menuItemId)

		// 7. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'recipe',
			entity: 'recipe',
			entityId: result.id,
			action: 'create',
			summary: `Created recipe "${data.name}" for menu item #${data.menuItemId}`,
			newValues: {
				name: data.name,
				menuItemId: data.menuItemId,
				yieldQty: data.yieldQty,
				linesCount: data.lines.length,
			},
		})

		return result
	}

	async handleUpdate(data: RecipeUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify recipe exists
		const existing = await this.handleGetById(id)

		// 2. Validate lines
		await this.validateLines(updateData.lines)

		// 3. Update recipe header
		const result = await this.repo.update(id, {
			name: updateData.name,
			yieldQty: updateData.yieldQty,
			...stampUpdate(actorId),
		})
		if (!result) throw RecipeError.updateFailed(id)

		// 4. Replace lines
		await this.repo.replaceLines(
			id,
			updateData.lines.map((line) => ({
				materialId: line.materialId,
				quantity: line.quantity,
				uomId: line.uomId,
			})),
		)

		// 5. Invalidate cache
		await this.cache.invalidateStandard(id)
		await this.invalidateMenuItemCache(existing.menuItemId)

		// 6. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
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
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Delete (cascades lines via FK)
		const result = await this.repo.remove(id)
		if (!result) throw RecipeError.deleteFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)
		await this.invalidateMenuItemCache(existing.menuItemId)

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'recipe',
			entity: 'recipe',
			entityId: id,
			action: 'delete',
			summary: `Deleted recipe "${existing.name}"`,
		})

		return result
	}

	async handleCalculateHpp(menuItemId: number, locationId: number): Promise<HppResponseDto> {
		// 1. Get active recipe
		const recipe = await this.getActiveByMenuItemId(menuItemId)
		if (!recipe) throw RecipeError.activeNotFound(menuItemId)

		// 2. Get lines
		const lines = await this.repo.findLinesByRecipeId(recipe.id)

		// 3. Get all conversions for UoM resolution
		const conversions = await this.uomService.getAllConversions()

		// 4. Calculate cost per line
		const breakdown: HppResponseDto['breakdown'] = []
		let totalCost = toDecimal(0)

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
			let convertedQty = toDecimal(line.quantity)
			if (line.uomId !== material.baseUomId) {
				const conversion = resolveConversion(
					line.uomId,
					material.baseUomId,
					line.quantity,
					conversions,
				)
				if (conversion) {
					convertedQty = toDecimal(conversion.result)
				}
				// If no conversion path, use raw quantity (best effort)
			}

			// Calculate line cost
			const unitCostDec = toDecimal(costPrice)
			const lineCost = convertedQty.mul(unitCostDec)
			totalCost = totalCost.add(lineCost)

			breakdown.push({
				materialId: line.materialId,
				materialName: material.name,
				quantity: line.quantity,
				uomCode,
				unitCost: costPrice,
				lineCost: roundCost(lineCost),
			})
		}

		// 5. Divide by yield qty
		const yieldQty = toDecimal(recipe.yieldQty)
		const hpp = yieldQty.isZero() ? '0' : roundCost(safeDivide(totalCost, yieldQty))

		return {
			menuItemId,
			locationId,
			hpp,
			breakdown,
		}
	}

	// ─── Private ───

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
				const conversion = resolveConversion(line.uomId, material.baseUomId, '1', conversions)
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
