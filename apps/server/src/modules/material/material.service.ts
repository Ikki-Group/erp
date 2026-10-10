import { materials } from '@/db/schema/material.ts'

import { checkConflict } from '@/infra/database/conflict.ts'
import type { Db } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import { resolveConversion } from '@/modules/uom/index.ts'
import type { UomService } from '@/modules/uom/index.ts'

import type { CategoryService } from './category/category.service.ts'
import type {
	MaterialCreateDto,
	MaterialDto,
	MaterialFilterDto,
	MaterialUpdateDto,
} from './material.contract.ts'
import { MaterialError, uniqueFields } from './material.internal.ts'
import type { MaterialRepo } from './material.repo.ts'

interface Deps extends Infra {
	repo: MaterialRepo
	uom: Pick<UomService, 'handleGetById' | 'getAllConversions'>
	category: Pick<CategoryService, 'handleGetById'>
}

interface DefaultUoms {
	defaultPurchaseUomId: number | null
	defaultStockUomId: number | null
	defaultRecipeUomId: number | null
}

const AUDIT = { module: 'material', entity: 'material' } as const

export class MaterialService {
	constructor(private readonly deps: Deps) {}

	getById(id: number, db?: Db): Promise<MaterialDto | undefined> {
		return this.deps.repo.findById(id, db)
	}

	getByIds(ids: number[], db?: Db): Promise<MaterialDto[]> {
		return this.deps.repo.findByIds(ids, db)
	}

	async handleGetById(id: number, db?: Db): Promise<MaterialDto> {
		return assertFound(await this.getById(id, db), () => MaterialError.notFound(id))
	}

	handleList(filter: MaterialFilterDto): Promise<WithPaginationResult<MaterialDto>> {
		return this.deps.repo.findPage(filter)
	}

	async handleCreate(data: MaterialCreateDto, actor: Actor): Promise<EntityRef> {
		await this.#validateRefs(data.categoryId, data.baseUomId, data)
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: materials,
				pkColumn: materials.id,
				fields: uniqueFields,
				input: data,
			})
			const written = await repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw MaterialError.createFailed()
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created material "${data.name}" (${data.code})`,
				newValues: { code: data.code, name: data.name, type: data.type },
			})
			return written
		})
	}

	async handleUpdate(data: MaterialUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		await this.#validateRefs(changes.categoryId, changes.baseUomId, changes)
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw MaterialError.notFound(id)
			await checkConflict({
				db: tx,
				table: materials,
				pkColumn: materials.id,
				fields: uniqueFields,
				input: changes,
				excludeId: id,
			})
			const written = await repo.update(id, { ...changes, ...stampUpdate(actor.id) }, tx)
			if (!written) throw MaterialError.updateFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated material "${data.name}" (${data.code})`,
				newValues: { code: data.code, name: data.name, type: data.type },
			})
			return written
		})
	}

	handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw MaterialError.notFound(id)
			const written = await repo.remove(id, stampUpdate(actor.id), tx)
			if (!written) throw MaterialError.deleteFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'delete',
				summary: `Deleted material "${existing.name}" (${existing.code})`,
			})
			return written
		})
	}

	/** Category and base UoM must exist; each default UoM must convert to the base UoM. */
	async #validateRefs(
		categoryId: number | null,
		baseUomId: number,
		defaults: DefaultUoms,
	): Promise<void> {
		const { uom, category } = this.deps
		if (categoryId) await category.handleGetById(categoryId)
		await uom.handleGetById(baseUomId)
		const conversions = await uom.getAllConversions()
		const uomIds = [
			defaults.defaultPurchaseUomId,
			defaults.defaultStockUomId,
			defaults.defaultRecipeUomId,
		]
		for (const uomId of uomIds) {
			if (!uomId) continue
			await uom.handleGetById(uomId)
			if (!resolveConversion(uomId, baseUomId, Qty.of('1'), conversions)) {
				throw MaterialError.uomNotConvertible(uomId, baseUomId)
			}
		}
	}
}
