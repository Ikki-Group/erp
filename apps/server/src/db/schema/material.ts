import { and, eq, gt, gte, isNull, or } from 'drizzle-orm'
import {
	boolean,
	check,
	index,
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers'
import { locationsTable } from './location'
import { uomsTable } from './uom'

/**
 * Material Categories Table
 *
 * Reference/lookup table for classifying materials.
 *
 * `code` — stable, normalized machine identifier (e.g. 'RM', 'PKG').
 *           Used in seeding and application logic. Never changes after creation.
 * `name` — human-readable display label. Unique and immutable after creation
 *           (rename via migration only, not a user-facing operation).
 */
export const materialCategoriesTable = pgTable(
	'material_categories',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		description: text('description'),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('material_categories_code_idx').on(t.code),
		uniqueIndex('material_categories_name_idx').on(t.name),
	],
)

export const materialTypeEnum = pgEnum('material_type', ['raw', 'semi', 'packaging'])

/**
 * Materials Table
 *
 * Master catalog of all materials in the system.
 *
 * `sku`        — primary external-facing natural key. Unique and stable.
 *                All cross-system references (imports, exports, barcodes)
 *                should use SKU, not the surrogate `id`.
 *
 * `name`       — unique within the same `type`. A raw material and a packaging
 *                material may share a common name (e.g. "Salt") without conflict.
 *
 * `categoryId` — required classification. onDelete: 'restrict' — a category
 *                in use cannot be deleted. Reassign materials first.
 *
 * `baseUomId`  — the canonical unit all conversions resolve to.
 *                onDelete: 'restrict' — cannot delete a UOM that is a base unit.
 *
 * `isActive`   — soft-disable for discontinued materials. Inactive materials
 *                must not be used in new transactions. Partial unique indexes
 *                on `sku` and `(name, type)` allow reuse of identifiers after
 *                deactivation.
 */
export const materialsTable = pgTable(
	'materials',
	{
		...pk,
		sku: text('sku').notNull(),
		name: text('name').notNull(),
		type: materialTypeEnum('type').notNull(),
		description: text('description'),
		categoryId: integer('category_id')
			.notNull()
			.references(() => materialCategoriesTable.id, { onDelete: 'restrict' }),
		baseUomId: integer('base_uom_id')
			.notNull()
			.references(() => uomsTable.id, { onDelete: 'restrict' }),
		isActive: boolean('is_active').notNull().default(true),
		...auditBasicColumns,
	},
	(t) => [
		// Partial unique indexes: deactivated materials don't block reuse
		uniqueIndex('materials_sku_active_idx')
			.on(t.sku)
			.where(eq(t.isActive, true)),
		uniqueIndex('materials_name_type_active_idx')
			.on(t.name, t.type)
			.where(eq(t.isActive, true)),

		index('materials_category_idx').on(t.categoryId),
		index('materials_base_uom_idx').on(t.baseUomId),
	],
)

/**
 * Material Conversions Table
 *
 * Defines how alternative UOMs convert to the material's base UOM.
 * One-directional: always toBase. Inverse is computed at the application layer.
 *
 * Example: if baseUom = 'kg', a row {uomId: gram, toBaseFactor: 0.001} means
 *          1 gram = 0.001 kg.
 *
 * `toBaseFactor` — multiplier to convert 1 unit of `uomId` → base UOM quantity.
 *                  Must be strictly positive. Zero and negative values are
 *                  mathematically invalid and rejected at the DB level.
 *
 * `isActive`    — retire a conversion without hard-deleting it. Inactive
 *                 conversions must not be used in new transactions, but remain
 *                 for historical recalculation integrity.
 *
 * Service-layer invariant (cannot be enforced at DB level):
 *   `uomId` must not equal `material.baseUomId` — converting base to itself
 *   is a degenerate no-op and should be rejected before insert.
 */
export const materialConversionsTable = pgTable(
	'material_conversions',
	{
		...pk,
		materialId: integer('material_id')
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'cascade' }),
		uomId: integer('uom_id')
			.notNull()
			.references(() => uomsTable.id, { onDelete: 'restrict' }),
		toBaseFactor: numeric('to_base_factor', { precision: 18, scale: 6 }).notNull(),
		isActive: boolean('is_active').notNull().default(true),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('material_conversions_material_uom_idx').on(t.materialId, t.uomId),
		index('material_conversions_uom_idx').on(t.uomId),

		// Conversion factor must be strictly positive
		check('material_conversions_factor_chk', gt(t.toBaseFactor, 0)),
	],
)

/**
 * Material Locations Table  — configuration layer
 *
 * Registers a material as active at a specific location and stores
 * per-location stock control thresholds.
 *
 * This table is config-only. Stock quantity and cost figures live in
 * `materialStockSnapshotsTable` below (the projection layer), which is rebuilt
 * from the inventory event log independently of this table.
 *
 * `minStock`     — lower bound for stock alerts. Default 0.
 * `maxStock`     — upper bound for stock alerts. Null = uncapped.
 * `reorderPoint` — threshold that triggers a replenishment signal.
 *
 * Constraint: when maxStock is set, minStock ≤ reorderPoint ≤ maxStock.
 *
 * onDelete behaviour:
 *   materialId  → cascade  : location config is owned by the material.
 *   locationId  → restrict : retiring a location requires clearing its
 *                            material configs first (service layer responsibility).
 */
export const materialLocationsTable = pgTable(
	'material_locations',
	{
		...pk,
		materialId: integer('material_id')
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'cascade' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		minStock: numeric('min_stock', { precision: 18, scale: 6 }).notNull().default('0'),
		maxStock: numeric('max_stock', { precision: 18, scale: 6 }),
		reorderPoint: numeric('reorder_point', { precision: 18, scale: 6 }).notNull().default('0'),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('material_locations_material_location_idx').on(t.materialId, t.locationId),
		index('material_locations_location_idx').on(t.locationId),

		// When maxStock is set: minStock ≤ reorderPoint ≤ maxStock
		check(
			'material_locations_stock_range_chk',
			or(isNull(t.maxStock), and(gte(t.maxStock, t.minStock), gte(t.maxStock, t.reorderPoint)))!,
		),
	],
)

/**
 * Material Stock Snapshots Table  — projection layer
 *
 * Materialized read-model of current stock state per material per location.
 * Rebuilt by replaying the inventory event log — never mutated directly
 * by business logic.
 *
 * Separation rationale:
 *   - Config (materialLocationsTable above) changes rarely, owned by operators.
 *   - Snapshots change on every stock movement, owned by the inventory
 *     event handler. Keeping them separate eliminates row-level lock
 *     contention between config edits and high-churn stock updates.
 *
 * `currentQty`      — quantity on hand, expressed in the material's base UOM.
 * `currentAvgCost`  — weighted average cost per base UOM unit.
 * `currentValue`    — currentQty × currentAvgCost. Stored (not generated)
 *                     for query performance; always consistent with the other
 *                     two columns because all three are updated atomically
 *                     by the event handler.
 * `snapshotAt`      — timestamp of the last successful recalculation.
 *                     Used for staleness detection, incremental rebuild
 *                     (skip rows newer than job start), and debugging
 *                     (compare against event log to find unapplied events).
 *
 * All numeric columns use scale: 6 to match materialConversionsTable
 * and prevent precision loss when qty derives from a UOM conversion.
 */
export const materialStockSnapshotsTable = pgTable(
	'material_stock_snapshots',
	{
		...pk,
		materialId: integer('material_id')
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'cascade' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		currentQty: numeric('current_qty', { precision: 18, scale: 6 }).notNull().default('0'),
		currentAvgCost: numeric('current_avg_cost', { precision: 18, scale: 6 }).notNull().default('0'),
		currentValue: numeric('current_value', { precision: 18, scale: 6 }).notNull().default('0'),
		snapshotAt: timestamp('snapshot_at', { mode: 'date', withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		uniqueIndex('material_stock_snapshots_material_location_idx').on(t.materialId, t.locationId),
		index('material_stock_snapshots_location_idx').on(t.locationId),

		// Staleness sweep: find all snapshots older than threshold
		index('material_stock_snapshots_snapshot_at_idx').on(t.snapshotAt),

		// currentQty can never be negative (physical stock constraint)
		check('material_stock_snapshots_qty_chk', gte(t.currentQty, 0)),
		// Cost and value are non-negative
		check(
			'material_stock_snapshots_cost_chk',
			and(gte(t.currentAvgCost, 0), gte(t.currentValue, 0))!,
		),
	],
)
