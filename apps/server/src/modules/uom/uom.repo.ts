import { uoms, uomConversions } from '@/db/schema/uom.ts'

import { createCrudRepo } from '@/infra/database/crud.repo.ts'
import type { CrudRepo } from '@/infra/database/crud.repo.ts'
import { allOf, eqIf, searchAcross } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { UomConversionDto, UomDto, UomFilterDto } from './uom.contract.ts'

// ─── Types ───

type UomInsert = typeof uoms.$inferInsert
type UomRow = typeof uoms.$inferSelect

type UomConversionInsert = typeof uomConversions.$inferInsert
type UomConversionRow = typeof uomConversions.$inferSelect

// ─── Mappers ───

function toDto(row: UomRow): UomDto {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		category: row.category,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

function toConversionDto(row: UomConversionRow): UomConversionDto {
	return {
		id: row.id,
		fromUomId: row.fromUomId,
		toUomId: row.toUomId,
		factor: row.factor,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface IUomRepo extends CrudRepo<UomDto, UomInsert> {
	findPage(filter: UomFilterDto, db?: DbContext): Promise<WithPaginationResult<UomDto>>
	findAllConversions(db?: DbContext): Promise<UomConversionDto[]>
	findConversionById(id: number, db?: DbContext): Promise<UomConversionDto | undefined>
	insertConversion(data: UomConversionInsert, db?: DbContext): Promise<EntityRef | undefined>
	removeConversion(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export function createUomRepo(baseDb: DbContext): IUomRepo {
	const crud = createCrudRepo({ db: baseDb, table: uoms, toDto })
	const conversions = createCrudRepo({
		db: baseDb,
		table: uomConversions,
		toDto: toConversionDto,
	})

	return {
		...crud,

		findPage: (filter, db) =>
			crud.paginate(
				filter,
				{
					where: allOf(
						searchAcross(filter.q, [uoms.code, uoms.name]),
						eqIf(uoms.category, filter.category),
					),
				},
				db,
			),

		findAllConversions: conversions.findMany,
		findConversionById: conversions.findById,
		insertConversion: conversions.insert,
		removeConversion: conversions.remove,
	}
}
