import { menuItemModifiers } from '@/db/schema/menu.ts'

import { eq, sql } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { MenuItemModifierDto, ModifierGroupAssignmentInput } from './assignment.contract.ts'

// ─── Types ───

type AssignmentInsert = typeof menuItemModifiers.$inferInsert
type AssignmentRow = typeof menuItemModifiers.$inferSelect

function toDto(row: AssignmentRow): MenuItemModifierDto {
	return {
		id: row.id,
		menuItemId: row.menuItemId,
		modifierGroupId: row.modifierGroupId,
		sortOrder: row.sortOrder,
	}
}

// ─── Interface ───

export interface IAssignmentRepo {
	readonly db: DbContext
	findByMenuItemId(menuItemId: number, db?: DbContext): Promise<MenuItemModifierDto[]>
	findByMenuItemIds(menuItemIds: number[], db?: DbContext): Promise<MenuItemModifierDto[]>
	replaceForItem(
		menuItemId: number,
		assignments: ModifierGroupAssignmentInput[],
		db?: DbContext,
	): Promise<void>
}

// ─── Implementation ───

export class AssignmentRepo implements IAssignmentRepo {
	constructor(readonly db: DbContext) {}

	async findByMenuItemId(
		menuItemId: number,
		db: DbContext = this.db,
	): Promise<MenuItemModifierDto[]> {
		const rows = await db
			.select()
			.from(menuItemModifiers)
			.where(eq(menuItemModifiers.menuItemId, menuItemId))
			.orderBy(sql`${menuItemModifiers.sortOrder} asc, ${menuItemModifiers.id} asc`)
		return rows.map(toDto)
	}

	async findByMenuItemIds(
		menuItemIds: number[],
		db: DbContext = this.db,
	): Promise<MenuItemModifierDto[]> {
		if (menuItemIds.length === 0) return []
		const rows = await db
			.select()
			.from(menuItemModifiers)
			.where(sql`${menuItemModifiers.menuItemId} in ${menuItemIds}`)
			.orderBy(sql`${menuItemModifiers.sortOrder} asc, ${menuItemModifiers.id} asc`)
		return rows.map(toDto)
	}

	async replaceForItem(
		menuItemId: number,
		assignments: ModifierGroupAssignmentInput[],
		db: DbContext = this.db,
	): Promise<void> {
		// Delete existing assignments
		await db.delete(menuItemModifiers).where(eq(menuItemModifiers.menuItemId, menuItemId))

		// Insert new assignments
		if (assignments.length > 0) {
			const values: AssignmentInsert[] = assignments.map((a) => ({
				menuItemId,
				modifierGroupId: a.groupId,
				sortOrder: a.sortOrder,
			}))
			await db.insert(menuItemModifiers).values(values)
		}
	}
}
