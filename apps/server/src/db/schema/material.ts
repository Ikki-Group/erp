import { isNull } from 'drizzle-orm'
import { index, integer, numeric, pgTable, text, uniqueIndex, type AnyPgColumn } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { materialTypeEnum } from './_helpers'
import { locationsTable } from './location'

// ─── UOM (Unit of Measure) ────────────────────────────────────────────────────

export const uomsTable = pgTable('uoms', { ...pk, code: text().notNull(), ...auditColumns }, (t) => [
  uniqueIndex('uoms_code_idx').on(t.code).where(isNull(t.deletedAt)),
])

// ─── Material Categories ──────────────────────────────────────────────────────

export const materialCategoriesTable = pgTable(
  'material_categories',
  {
    ...pk,
    name: text().notNull(),
    description: text(),
    parentId: integer().references((): AnyPgColumn => materialCategoriesTable.id, { onDelete: 'set null' }),
    ...auditColumns,
  },
  (t) => [uniqueIndex('material_categories_name_idx').on(t.name).where(isNull(t.deletedAt))],
)

// ─── Materials ────────────────────────────────────────────────────────────────

export const materialsTable = pgTable(
  'materials',
  {
    ...pk,
    name: text().notNull(),
    description: text(),
    sku: text().notNull(),
    type: materialTypeEnum().notNull(),
    categoryId: integer().references(() => materialCategoriesTable.id, { onDelete: 'set null' }),
    baseUomId: integer()
      .notNull()
      .references(() => uomsTable.id, { onDelete: 'restrict' }),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('materials_name_idx').on(t.name).where(isNull(t.deletedAt)),
    uniqueIndex('materials_sku_idx').on(t.sku).where(isNull(t.deletedAt)),
    index('materials_category_idx').on(t.categoryId),
    index('materials_base_uom_idx').on(t.baseUomId),
  ],
)

// ─── Material Conversions ─────────────────────────────────────────────────────

export const materialConversionsTable = pgTable(
  'material_conversions',
  {
    ...pk,
    materialId: integer()
      .notNull()
      .references(() => materialsTable.id, { onDelete: 'cascade' }),
    uomId: integer()
      .notNull()
      .references(() => uomsTable.id, { onDelete: 'restrict' }),
    toBaseFactor: numeric({ precision: 18, scale: 6 }).notNull(),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('material_conversions_material_uom_idx').on(t.materialId, t.uomId).where(isNull(t.deletedAt)),
    index('material_conversions_uom_idx').on(t.uomId),
  ],
)

// ─── Material Locations ───────────────────────────────────────────────────────

export const materialLocationsTable = pgTable(
  'material_locations',
  {
    ...pk,
    materialId: integer()
      .notNull()
      .references(() => materialsTable.id, { onDelete: 'cascade' }),
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),

    // Per-location configuration
    minStock: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    maxStock: numeric({ precision: 18, scale: 4 }),
    reorderPoint: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

    // Current stock snapshot (maintained by inventory module)
    currentQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    currentAvgCost: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    currentValue: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

    ...auditColumns,
  },
  (t) => [
    uniqueIndex('material_locations_material_location_idx').on(t.materialId, t.locationId).where(isNull(t.deletedAt)),
    index('material_locations_location_idx').on(t.locationId),
  ],
)
