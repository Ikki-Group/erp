import type { Db } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { StockService } from '@/modules/inventory/index.ts'
import type { MaterialService } from '@/modules/material/index.ts'
import type { ItemService } from '@/modules/menu/index.ts'
import { resolveConversion } from '@/modules/uom/index.ts'
import type { UomService } from '@/modules/uom/index.ts'

import { calculateHpp } from './recipe.calculator.ts'
import type {
	HppResponseDto,
	RecipeCreateDto,
	RecipeDetailDto,
	RecipeDto,
	RecipeFilterDto,
	RecipeLineDto,
	RecipeUpdateDto,
} from '@ikki/contract/recipe'
import { RecipeError } from './recipe.internal.ts'
import type { RecipeRepo } from './recipe.repo.ts'

interface Deps extends Infra {
	repo: RecipeRepo
	menu: Pick<ItemService, 'handleGetById'>
	material: Pick<MaterialService, 'getById' | 'getByIds'>
	uom: Pick<UomService, 'getById' | 'handleGetById' | 'getAllConversions'>
	stock: Pick<StockService, 'getBalances'>
}

type LineInput = RecipeCreateDto['lines'][number]

const AUDIT = { module: 'recipe', entity: 'recipe' } as const

export class RecipeService {
	constructor(private readonly deps: Deps) {}

	getActiveByMenuItemId(menuItemId: number, db?: Db): Promise<RecipeDto | undefined> {
		return this.deps.repo.findActiveByMenuItemId(menuItemId, db)
	}

	getLinesByRecipeId(recipeId: number, db?: Db): Promise<RecipeLineDto[]> {
		return this.deps.repo.findLinesByRecipeId(recipeId, db)
	}

	async handleGetById(id: number, db?: Db): Promise<RecipeDto> {
		return assertFound(await this.deps.repo.findById(id, db), () => RecipeError.notFound(id))
	}

	async handleDetail(id: number): Promise<RecipeDetailDto> {
		return this.#withLines(await this.handleGetById(id))
	}

	async handleDetailByMenuItem(menuItemId: number): Promise<RecipeDetailDto> {
		const recipe = await this.getActiveByMenuItemId(menuItemId)
		if (!recipe) throw RecipeError.activeNotFound(menuItemId)
		return this.#withLines(recipe)
	}

	handleList(filter: RecipeFilterDto): Promise<WithPaginationResult<RecipeDto>> {
		return this.deps.repo.findPage(filter)
	}

	handleCreate(data: RecipeCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, menu } = this.deps
		return uow.run(async (tx) => {
			await menu.handleGetById(data.menuItemId, tx)
			await this.#validateLines(data.lines, tx)
			await repo.deactivateByMenuItemId(data.menuItemId, tx)
			const written = await repo.insert(
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
			await repo.replaceLines(written.id, data.lines, tx)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created recipe "${data.name}" for menu item #${data.menuItemId}`,
				newValues: {
					name: data.name,
					menuItemId: data.menuItemId,
					yieldQty: data.yieldQty,
					linesCount: data.lines.length,
				},
			})
			return written
		})
	}

	handleUpdate(data: RecipeUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			await this.handleGetById(id, tx)
			await this.#validateLines(changes.lines, tx)
			const written = await repo.update(
				id,
				{ name: changes.name, yieldQty: changes.yieldQty, ...stampUpdate(actor.id) },
				tx,
			)
			if (!written) throw RecipeError.updateFailed(id)
			await repo.replaceLines(id, changes.lines, tx)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated recipe "${changes.name}"`,
				newValues: {
					name: changes.name,
					yieldQty: changes.yieldQty,
					linesCount: changes.lines.length,
				},
			})
			return written
		})
	}

	handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await this.handleGetById(id, tx)
			const written = await repo.remove(id, tx)
			if (!written) throw RecipeError.deleteFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'delete',
				summary: `Deleted recipe "${existing.name}"`,
			})
			return written
		})
	}

	async handleCalculateHpp(menuItemId: number, locationId: number): Promise<HppResponseDto> {
		const { repo, material, uom, stock } = this.deps
		const recipe = await this.getActiveByMenuItemId(menuItemId)
		if (!recipe) throw RecipeError.activeNotFound(menuItemId)

		const lines = await repo.findLinesByRecipeId(recipe.id)
		const materialIds = [...new Set(lines.map((l) => l.materialId))]
		const [conversions, materials, balances, uomCodes] = await Promise.all([
			uom.getAllConversions(),
			material.getByIds(materialIds),
			stock.getBalances(materialIds, locationId),
			this.#uomCodes(lines),
		])
		const materialById = new Map(materials.map((m) => [m.id, m]))
		const costByMaterial = new Map(balances.map((b) => [b.materialId, b.costPrice]))

		// Unknown materials cost zero; a missing conversion path falls back to the raw qty.
		const costed = lines.map((line) => {
			const mat = materialById.get(line.materialId)
			const unitCost = mat ? (costByMaterial.get(line.materialId) ?? '0') : '0'
			const qty = Qty.of(line.quantity)
			const baseQty = mat
				? (resolveConversion(line.uomId, mat.baseUomId, qty, conversions)?.result ?? qty)
				: Qty.zero()
			return { line, mat, unitCost, baseQty }
		})
		const { lineCosts, hpp } = calculateHpp(
			costed.map((c) => ({ baseQty: c.baseQty, unitCost: Money.of(c.unitCost) })),
			Qty.of(recipe.yieldQty),
		)

		return {
			menuItemId,
			locationId,
			hpp: hpp.toCost(),
			breakdown: costed.map(({ line, mat, unitCost }, i) => ({
				materialId: line.materialId,
				materialName: mat?.name ?? `Unknown Material #${line.materialId}`,
				quantity: line.quantity,
				uomCode: mat ? (uomCodes.get(line.uomId) ?? '') : '',
				unitCost,
				lineCost: mat ? (lineCosts[i] ?? Money.zero()).toCost() : '0',
			})),
		}
	}

	// ─── Private ───

	async #validateLines(lines: LineInput[], tx: Db): Promise<void> {
		const { material, uom } = this.deps
		const conversions = await uom.getAllConversions(tx)
		for (const line of lines) {
			const mat = await material.getById(line.materialId, tx)
			if (!mat) throw RecipeError.materialNotFound(line.materialId)
			await uom.handleGetById(line.uomId, tx)
			if (!resolveConversion(line.uomId, mat.baseUomId, Qty.of('1'), conversions)) {
				throw RecipeError.uomNotConvertible(line.uomId, mat.baseUomId)
			}
		}
	}

	async #withLines(recipe: RecipeDto): Promise<RecipeDetailDto> {
		const lines = await this.deps.repo.findLinesByRecipeId(recipe.id)
		const materialIds = [...new Set(lines.map((l) => l.materialId))]
		const [materials, uomCodes] = await Promise.all([
			this.deps.material.getByIds(materialIds),
			this.#uomCodes(lines),
		])
		const nameById = new Map(materials.map((m) => [m.id, m.name]))
		return {
			...recipe,
			lines: lines.map((line) => ({
				...line,
				materialName: nameById.get(line.materialId) ?? '',
				uomCode: uomCodes.get(line.uomId) ?? '',
			})),
		}
	}

	async #uomCodes(lines: RecipeLineDto[]): Promise<Map<number, string>> {
		const ids = [...new Set(lines.map((l) => l.uomId))]
		const uoms = await Promise.all(ids.map((id) => this.deps.uom.getById(id)))
		return new Map(uoms.flatMap((u) => (u ? [[u.id, u.code] as const] : [])))
	}
}
