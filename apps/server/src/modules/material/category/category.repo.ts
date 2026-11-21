import { materialCategories } from '@/db/schema/material.ts'

import { createCrudRepo } from '@/infra/database/crud.repo.ts'
import type { CrudRepo } from '@/infra/database/crud.repo.ts'
import { searchAcross } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'

import type { MaterialCategoryDto, MaterialCategoryFilterDto } from './category.contract.ts'

// ─── Types ───

type CategoryInsert = typeof materialCategories.$inferInsert
type CategoryRow = typeof materialCategories.$inferSelect

function toDto(row: CategoryRow): MaterialCategoryDto {
	return {
		id: row.id,
		name: row.name,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface ICategoryRepo extends CrudRepo<MaterialCategoryDto, CategoryInsert> {
	findPage(
		filter: MaterialCategoryFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<MaterialCategoryDto>>
}

// ─── Implementation ───

export function createCategoryRepo(baseDb: DbContext): ICategoryRepo {
	const crud = createCrudRepo({ db: baseDb, table: materialCategories, toDto })

	return {
		...crud,
		findPage: (filter, db) =>
			crud.paginate(filter, { where: searchAcross(filter.q, [materialCategories.name]) }, db),
	}
}
