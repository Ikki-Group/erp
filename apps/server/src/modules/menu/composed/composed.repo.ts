import {
	menuCategories,
	menuItemModifiers,
	menuItems,
	modifierGroups,
	modifierOptions,
} from '@/db/schema/menu.ts'

import { eq, sql, takeFirst } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { MenuCategoryRefDto, MenuItemDetailDto } from './composed.contract.ts'

// ─── Interface ───

export interface IComposedRepo {
	readonly db: DbContext
	findDetailById(id: number, db?: DbContext): Promise<MenuItemDetailDto | undefined>
}

// ─── Implementation ───

export class ComposedRepo implements IComposedRepo {
	constructor(readonly db: DbContext) {}

	async findDetailById(
		id: number,
		db: DbContext = this.db,
	): Promise<MenuItemDetailDto | undefined> {
		// 1. Load menu item
		const item = await db
			.select()
			.from(menuItems)
			.where(eq(menuItems.id, id))
			.limit(1)
			.then(takeFirst)

		if (!item) return undefined

		// 2. Load category (if assigned)
		let category: MenuCategoryRefDto | null = null
		if (item.categoryId) {
			const catRow = await db
				.select({ id: menuCategories.id, name: menuCategories.name })
				.from(menuCategories)
				.where(eq(menuCategories.id, item.categoryId))
				.limit(1)
				.then(takeFirst)
			if (catRow) {
				category = { id: catRow.id, name: catRow.name }
			}
		}

		// 3. Load assigned modifier groups (via join table)
		const assignmentRows = await db
			.select({
				assignmentId: menuItemModifiers.id,
				sortOrder: menuItemModifiers.sortOrder,
				groupId: modifierGroups.id,
				groupLocationId: modifierGroups.locationId,
				groupName: modifierGroups.name,
				groupSelectionType: modifierGroups.selectionType,
				groupIsRequired: modifierGroups.isRequired,
				groupMinSelect: modifierGroups.minSelect,
				groupMaxSelect: modifierGroups.maxSelect,
				groupCreatedAt: modifierGroups.createdAt,
				groupUpdatedAt: modifierGroups.updatedAt,
				groupCreatedBy: modifierGroups.createdBy,
				groupUpdatedBy: modifierGroups.updatedBy,
			})
			.from(menuItemModifiers)
			.innerJoin(modifierGroups, eq(menuItemModifiers.modifierGroupId, modifierGroups.id))
			.where(eq(menuItemModifiers.menuItemId, id))
			.orderBy(sql`${menuItemModifiers.sortOrder} asc, ${menuItemModifiers.id} asc`)

		// 4. Batch-load options for all assigned groups
		const groupIds = assignmentRows.map((r) => r.groupId)
		let optionRows: Array<typeof modifierOptions.$inferSelect> = []
		if (groupIds.length > 0) {
			optionRows = await db
				.select()
				.from(modifierOptions)
				.where(sql`${modifierOptions.groupId} in ${groupIds}`)
				.orderBy(sql`${modifierOptions.sortOrder} asc, ${modifierOptions.id} asc`)
		}

		// Group options by groupId
		const optionsByGroup = new Map<number, typeof optionRows>()
		for (const opt of optionRows) {
			const existing = optionsByGroup.get(opt.groupId) ?? []
			existing.push(opt)
			optionsByGroup.set(opt.groupId, existing)
		}

		// 5. Assemble modifier groups with options
		const modifierGroupsResult = assignmentRows.map((row) => ({
			id: row.groupId,
			locationId: row.groupLocationId,
			name: row.groupName,
			selectionType: row.groupSelectionType,
			isRequired: row.groupIsRequired,
			minSelect: row.groupMinSelect,
			maxSelect: row.groupMaxSelect,
			createdAt: row.groupCreatedAt,
			updatedAt: row.groupUpdatedAt,
			createdBy: row.groupCreatedBy,
			updatedBy: row.groupUpdatedBy,
			options: (optionsByGroup.get(row.groupId) ?? []).map((opt) => ({
				id: opt.id,
				groupId: opt.groupId,
				name: opt.name,
				priceAdjustment: opt.priceAdjustment,
				isDefault: opt.isDefault,
				sortOrder: opt.sortOrder,
				isActive: opt.isActive,
			})),
		}))

		return {
			id: item.id,
			locationId: item.locationId,
			sku: item.sku,
			name: item.name,
			categoryId: item.categoryId,
			basePrice: item.basePrice,
			status: item.status,
			imageUrl: item.imageUrl,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
			createdBy: item.createdBy,
			updatedBy: item.updatedBy,
			category,
			modifierGroups: modifierGroupsResult,
		}
	}
}
