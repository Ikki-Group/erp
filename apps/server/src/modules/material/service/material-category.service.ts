import { record } from '@elysiajs/opentelemetry'

import { checkConflict, type ConflictField } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { materialCategoriesTable } from '@/db/schema'

import type {
	MaterialCategoryCreateDto,
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryUpdateDto,
} from '../dto'
import { MaterialCategoryRepo } from '../repo'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Material category with ID ${id} not found`, 'MATERIAL_CATEGORY_NOT_FOUND'),
	createFailed: () =>
		new InternalServerError('Material category creation failed', 'MATERIAL_CATEGORY_CREATE_FAILED'),
}

const uniqueFields: ConflictField<'name'>[] = [
	{
		field: 'name',
		column: materialCategoriesTable.name,
		message: 'Material category name already exists',
		code: 'MATERIAL_CATEGORY_NAME_ALREADY_EXISTS',
	},
]

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class MaterialCategoryService {
	constructor(private repo = new MaterialCategoryRepo()) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async find(): Promise<MaterialCategoryDto[]> {
		return record('MaterialCategoryService.find', async () => {
			return this.repo.getList()
		})
	}

	async getById(id: number): Promise<MaterialCategoryDto | undefined> {
		return record('MaterialCategoryService.getById', async () => {
			return this.repo.getById(id)
		})
	}

	async count(): Promise<number> {
		return record('MaterialCategoryService.count', async () => {
			return this.repo.count()
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: MaterialCategoryFilterDto,
	): Promise<WithPaginationResult<MaterialCategoryDto>> {
		return record('MaterialCategoryService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<MaterialCategoryDto> {
		return record('MaterialCategoryService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: MaterialCategoryCreateDto, actorId: number): Promise<{ id: number }> {
		return record('MaterialCategoryService.handleCreate', async () => {
			const name = data.name.trim()

			await checkConflict({
				table: materialCategoriesTable,
				pkColumn: materialCategoriesTable.id,
				fields: uniqueFields,
				input: { name },
			})

			const result = await this.repo.create({ ...data, name, createdBy: actorId })
			return result
		})
	}

	async handleUpdate(
		id: number,
		data: Partial<MaterialCategoryUpdateDto>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('MaterialCategoryService.handleUpdate', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			const name = data.name ? data.name.trim() : existing.name

			await checkConflict({
				table: materialCategoriesTable,
				pkColumn: materialCategoriesTable.id,
				fields: uniqueFields,
				input: { name },
				existing,
			})

			const result = await this.repo.update(id, { ...data, name, updatedBy: actorId })
			return result
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('MaterialCategoryService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			const result = await this.repo.remove(id, actorId)
			if (!result) throw err.notFound(id)

			return result
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('MaterialCategoryService.handleHardRemove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			const result = await this.repo.hardRemove(id)
			if (!result) throw err.notFound(id)

			return result
		})
	}
}
