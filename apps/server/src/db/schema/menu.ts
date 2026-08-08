import { pgTable, pgEnum, varchar, numeric, integer, index, uniqueIndex } from 'drizzle-orm/pg-core'

import { pk, auditBasicColumns } from './_helpers.ts'
import { locations } from './core.ts'

// ─── Enums ───

export const menuItemStatusEnum = pgEnum('menu_item_status', ['active', 'inactive'])
export const selectionTypeEnum = pgEnum('selection_type', ['single', 'multiple'])

// ─── Menu Categories ───

export const menuCategories = pgTable(
	'menu_categories',
	{
		...pk,
		locationId: integer('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 255 }).notNull(),
		parentId: integer('parent_id'),
		sortOrder: integer('sort_order').notNull().default(0),
		...auditBasicColumns,
	},
	(t) => [
		index('menu_categories_location_id_idx').on(t.locationId),
		index('menu_categories_parent_id_idx').on(t.parentId),
	],
)

// ─── Menu Items ───

export const menuItems = pgTable(
	'menu_items',
	{
		...pk,
		locationId: integer('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'cascade' }),
		sku: varchar('sku', { length: 100 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		categoryId: integer('category_id').references(() => menuCategories.id, {
			onDelete: 'set null',
		}),
		basePrice: numeric('base_price', { precision: 18, scale: 2 }).notNull(),
		status: menuItemStatusEnum('status').notNull().default('active'),
		imageUrl: varchar('image_url', { length: 500 }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('menu_items_location_sku_uniq').on(t.locationId, t.sku),
		index('menu_items_location_id_idx').on(t.locationId),
		index('menu_items_category_id_idx').on(t.categoryId),
	],
)

// ─── Modifier Groups ───

export const modifierGroups = pgTable(
	'modifier_groups',
	{
		...pk,
		locationId: integer('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 255 }).notNull(),
		selectionType: selectionTypeEnum('selection_type').notNull().default('single'),
		isRequired: integer('is_required').notNull().default(0),
		minSelect: integer('min_select').notNull().default(0),
		maxSelect: integer('max_select'),
		...auditBasicColumns,
	},
	(t) => [index('modifier_groups_location_id_idx').on(t.locationId)],
)

// ─── Modifier Options ───

export const modifierOptions = pgTable(
	'modifier_options',
	{
		...pk,
		groupId: integer('group_id')
			.notNull()
			.references(() => modifierGroups.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 255 }).notNull(),
		priceAdjustment: numeric('price_adjustment', { precision: 18, scale: 2 })
			.notNull()
			.default('0'),
		isDefault: integer('is_default').notNull().default(0),
		sortOrder: integer('sort_order').notNull().default(0),
		isActive: integer('is_active').notNull().default(1),
	},
	(t) => [index('modifier_options_group_id_idx').on(t.groupId)],
)

// ─── Menu Item Modifiers (M:N Join) ───

export const menuItemModifiers = pgTable(
	'menu_item_modifiers',
	{
		...pk,
		menuItemId: integer('menu_item_id')
			.notNull()
			.references(() => menuItems.id, { onDelete: 'cascade' }),
		modifierGroupId: integer('modifier_group_id')
			.notNull()
			.references(() => modifierGroups.id, { onDelete: 'cascade' }),
		sortOrder: integer('sort_order').notNull().default(0),
	},
	(t) => [
		uniqueIndex('menu_item_modifiers_item_group_uniq').on(t.menuItemId, t.modifierGroupId),
		index('menu_item_modifiers_menu_item_id_idx').on(t.menuItemId),
		index('menu_item_modifiers_modifier_group_id_idx').on(t.modifierGroupId),
	],
)
