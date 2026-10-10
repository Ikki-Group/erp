import { materialCategories } from '@/db/schema/material.ts'

import { checkConflict } from '@/infra/database/conflict.ts'
import { defineConflictFields } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { CategoryRepo } from './category.repo.ts'
import type {
	MaterialCategoryCreateDto,
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryUpdateDto,
} from '@ikki/contract/material/category'

// ─── Error Factories ───

const CategoryError = {
	notFound: (id: number) =>
		new NotFoundError('Material category not found', {
			code: 'MATERIAL_CATEGORY_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Material category creation failed', {
			code: 'MATERIAL_CATEGORY_CREATE_FAILED',
		}),
	updateFailed: (id: number) =>
		new InternalServerError('Material category update failed', {
			code: 'MATERIAL_CATEGORY_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Material category deletion failed', {
			code: 'MATERIAL_CATEGORY_DELETE_FAILED',
			context: { id },
		}),
}

// ─── Unique Constraint Fields ───

const uniqueFields = defineConflictFields<MaterialCategoryCreateDto>()([
	{
		field: 'name',
		column: materialCategories.name,
		message: 'Material category name already exists',
		code: 'MATERIAL_CATEGORY_NAME_EXISTS',
	},
])

// ─── Service ───

interface Deps extends Infra {
	repo: CategoryRepo
}

const AUDIT = { module: 'material', entity: 'material_category' } as const

export class CategoryService {
	constructor(private readonly deps: Deps) {}

	async handleGetById(id: number): Promise<MaterialCategoryDto> {
		return assertFound(await this.deps.repo.findById(id), () => CategoryError.notFound(id))
	}

	handleList(
		filter: MaterialCategoryFilterDto,
	): Promise<WithPaginationResult<MaterialCategoryDto>> {
		return this.deps.repo.findPage(filter)
	}

	handleCreate(data: MaterialCategoryCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: materialCategories,
				pkColumn: materialCategories.id,
				fields: uniqueFields,
				input: data,
			})
			const written = await repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw CategoryError.createFailed()
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created material category "${data.name}"`,
				newValues: { name: data.name },
			})
			return written
		})
	}

	handleUpdate(data: MaterialCategoryUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw CategoryError.notFound(id)
			await checkConflict({
				db: tx,
				table: materialCategories,
				pkColumn: materialCategories.id,
				fields: uniqueFields,
				input: changes,
				excludeId: id,
			})
			const written = await repo.update(id, { ...changes, ...stampUpdate(actor.id) }, tx)
			if (!written) throw CategoryError.updateFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated material category "${data.name}"`,
				oldValues: { name: existing.name },
				newValues: { name: data.name },
			})
			return written
		})
	}

	handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw CategoryError.notFound(id)
			// FK SET NULL on materials.category_id
			const written = await repo.remove(id, tx)
			if (!written) throw CategoryError.deleteFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'delete',
				summary: `Deleted material category "${existing.name}"`,
			})
			return written
		})
	}
}
