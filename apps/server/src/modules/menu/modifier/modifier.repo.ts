import { modifierGroups, modifierOptions } from '@/db/schema/menu.ts'

import {
	allOf,
	eq,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type {
	ModifierGroupDto,
	ModifierGroupFilterDto,
	ModifierGroupWithOptionsDto,
	ModifierOptionDto,
	ModifierOptionInputDto,
} from './modifier.contract.ts'

// ─── Types ───

type GroupInsert = typeof modifierGroups.$inferInsert
type GroupUpdate = Partial<Omit<GroupInsert, 'id'>>
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

export interface IModifierRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<ModifierGroupDto | undefined>
	findByIdWithOptions(id: number, db?: DbContext): Promise<ModifierGroupWithOptionsDto | undefined>
	findByLocation(locationId: number, db?: DbContext): Promise<ModifierGroupDto[]>
	findPage(filter: ModifierGroupFilterDto, db?: DbContext): Promise<WithPaginationResult<ModifierGroupDto>>
	findOptionsByGroupId(groupId: number, db?: DbContext): Promise<ModifierOptionDto[]>
	findOptionsByGroupIds(groupIds: number[], db?: DbContext): Promise<ModifierOptionDto[]>
	insert(data: GroupInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: GroupUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
	replaceOptions(groupId: number, options: ModifierOptionInputDto[], db?: DbContext): Promise<void>
}

// ─── Implementation ───

export class ModifierRepo implements IModifierRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<ModifierGroupDto | undefined> {
		const row = await db
			.select()
			.from(modifierGroups)
			.where(eq(modifierGroups.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toGroupDto(row) : undefined
	}

	async findByIdWithOptions(id: number, db: DbContext = this.db): Promise<ModifierGroupWithOptionsDto | undefined> {
		const group = await this.findById(id, db)
		if (!group) return undefined

		const options = await this.findOptionsByGroupId(id, db)
		return { ...group, options }
	}

	async findByLocation(locationId: number, db: DbContext = this.db): Promise<ModifierGroupDto[]> {
		const rows = await db
			.select()
			.from(modifierGroups)
			.where(eq(modifierGroups.locationId, locationId))
			.orderBy(sql`${modifierGroups.name} asc`)
		return rows.map(toGroupDto)
	}

	async findPage(
		filter: ModifierGroupFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<ModifierGroupDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: modifierGroups.id,
				locationId: modifierGroups.locationId,
				name: modifierGroups.name,
				selectionType: modifierGroups.selectionType,
				isRequired: modifierGroups.isRequired,
				minSelect: modifierGroups.minSelect,
				maxSelect: modifierGroups.maxSelect,
				createdAt: modifierGroups.createdAt,
				updatedAt: modifierGroups.updatedAt,
				createdBy: modifierGroups.createdBy,
				updatedBy: modifierGroups.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(modifierGroups)
			.where(where)
			.orderBy(sql`${modifierGroups.name} asc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toGroupDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async findOptionsByGroupId(groupId: number, db: DbContext = this.db): Promise<ModifierOptionDto[]> {
		const rows = await db
			.select()
			.from(modifierOptions)
			.where(eq(modifierOptions.groupId, groupId))
			.orderBy(sql`${modifierOptions.sortOrder} asc, ${modifierOptions.id} asc`)
		return rows.map(toOptionDto)
	}

	async findOptionsByGroupIds(groupIds: number[], db: DbContext = this.db): Promise<ModifierOptionDto[]> {
		if (groupIds.length === 0) return []
		const rows = await db
			.select()
			.from(modifierOptions)
			.where(sql`${modifierOptions.groupId} in ${groupIds}`)
			.orderBy(sql`${modifierOptions.sortOrder} asc, ${modifierOptions.id} asc`)
		return rows.map(toOptionDto)
	}

	async insert(data: GroupInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(modifierGroups)
			.values(data)
			.returning({ id: modifierGroups.id })
		return result
	}

	async update(id: number, data: GroupUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(modifierGroups)
			.set(data)
			.where(eq(modifierGroups.id, id))
			.returning({ id: modifierGroups.id })
		return result
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		// Options cascade-deleted via FK
		const [result] = await db
			.delete(modifierGroups)
			.where(eq(modifierGroups.id, id))
			.returning({ id: modifierGroups.id })
		return result
	}

	async replaceOptions(groupId: number, options: ModifierOptionInputDto[], db: DbContext = this.db): Promise<void> {
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
	}

	// ─── Private ───

	#buildWhere(filter: ModifierGroupFilterDto) {
		return allOf(
			eq(modifierGroups.locationId, filter.locationId),
			searchAcross(filter.q, [modifierGroups.name]),
		)
	}
}
