import { modifierGroups, modifierOptions } from '@/db/schema/menu.ts'

import { createCrudRepo } from '@/infra/database/crud.repo.ts'
import type { CrudRepo } from '@/infra/database/crud.repo.ts'
import { allOf, eq, searchAcross, sql } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'

import type {
	ModifierGroupDto,
	ModifierGroupFilterDto,
	ModifierGroupWithOptionsDto,
	ModifierOptionDto,
	ModifierOptionInputDto,
} from './modifier.contract.ts'

// ─── Types ───

type GroupInsert = typeof modifierGroups.$inferInsert
type GroupRow = typeof modifierGroups.$inferSelect
type OptionInsert = typeof modifierOptions.$inferInsert
type OptionRow = typeof modifierOptions.$inferSelect

function toGroupDto(row: GroupRow): ModifierGroupDto {
	return {
		id: row.id,
		locationId: row.locationId,
		name: row.name,
		selectionType: row.selectionType,
		isRequired: row.isRequired,
		minSelect: row.minSelect,
		maxSelect: row.maxSelect,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

function toOptionDto(row: OptionRow): ModifierOptionDto {
	return {
		id: row.id,
		groupId: row.groupId,
		name: row.name,
		priceAdjustment: row.priceAdjustment,
		isDefault: row.isDefault,
		sortOrder: row.sortOrder,
		isActive: row.isActive,
	}
}

// ─── Interface ───

/** `remove` hard-deletes the group; options cascade-delete via FK. */
export interface IModifierRepo extends CrudRepo<ModifierGroupDto, GroupInsert> {
	findByIdWithOptions(id: number, db?: DbContext): Promise<ModifierGroupWithOptionsDto | undefined>
	findByLocation(locationId: number, db?: DbContext): Promise<ModifierGroupDto[]>
	findPage(
		filter: ModifierGroupFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<ModifierGroupDto>>
	findOptionsByGroupId(groupId: number, db?: DbContext): Promise<ModifierOptionDto[]>
	findOptionsByGroupIds(groupIds: number[], db?: DbContext): Promise<ModifierOptionDto[]>
	replaceOptions(groupId: number, options: ModifierOptionInputDto[], db?: DbContext): Promise<void>
}

// ─── Implementation ───

export function createModifierRepo(baseDb: DbContext): IModifierRepo {
	const crud = createCrudRepo({ db: baseDb, table: modifierGroups, toDto: toGroupDto })
	const optionOrder = sql`${modifierOptions.sortOrder} asc, ${modifierOptions.id} asc`

	async function findOptionsByGroupId(groupId: number, db: DbContext = baseDb) {
		const rows = await db
			.select()
			.from(modifierOptions)
			.where(eq(modifierOptions.groupId, groupId))
			.orderBy(optionOrder)
		return rows.map(toOptionDto)
	}

	return {
		...crud,

		async findByIdWithOptions(id, db = baseDb) {
			const group = await crud.findById(id, db)
			if (!group) return undefined

			const options = await findOptionsByGroupId(id, db)
			return { ...group, options }
		},

		async findByLocation(locationId, db = baseDb) {
			const rows = await db
				.select()
				.from(modifierGroups)
				.where(eq(modifierGroups.locationId, locationId))
				.orderBy(sql`${modifierGroups.name} asc`)
			return rows.map(toGroupDto)
		},

		findPage: (filter, db) =>
			crud.paginate(
				filter,
				{
					where: allOf(
						eq(modifierGroups.locationId, filter.locationId),
						searchAcross(filter.q, [modifierGroups.name]),
					),
					orderBy: sql`${modifierGroups.name} asc`,
				},
				db,
			),

		findOptionsByGroupId,

		async findOptionsByGroupIds(groupIds, db = baseDb) {
			if (groupIds.length === 0) return []
			const rows = await db
				.select()
				.from(modifierOptions)
				.where(sql`${modifierOptions.groupId} in ${groupIds}`)
				.orderBy(optionOrder)
			return rows.map(toOptionDto)
		},

		async replaceOptions(groupId, options, db = baseDb) {
			// Delete existing options
			await db.delete(modifierOptions).where(eq(modifierOptions.groupId, groupId))

			// Insert new options
			if (options.length > 0) {
				const values: OptionInsert[] = options.map((opt) => ({
					groupId,
					name: opt.name,
					priceAdjustment: opt.priceAdjustment,
					isDefault: opt.isDefault,
					sortOrder: opt.sortOrder,
					isActive: opt.isActive,
				}))
				await db.insert(modifierOptions).values(values)
			}
		},
	}
}
