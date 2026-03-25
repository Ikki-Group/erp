import { index, integer, numeric, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { materialTypeEnum, metadata, pk } from './_helpers'
import { locationsTable } from './location'

// ─── UOM (Unit of Measure) ────────────────────────────────────────────────────

export const uomsTable = pgTable(
  'uoms',
  {
    ...pk,
    code: text().notNull(),
    ...metadata,
  },
  (t) => [uniqueIndex('uoms_code_idx').on(t.code)]
)

// ─── Material Categories ──────────────────────────────────────────────────────

export const materialCategoriesTable = pgTable(
  'material_categories',
  {
    ...pk,
    name: text().notNull(),
    description: text(),
    ...metadata,
  },
  (t) => [uniqueIndex('material_categories_name_idx').on(t.name)]
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
    ...metadata,
  },
  (t) => [
    uniqueIndex('materials_name_idx').on(t.name),
    uniqueIndex('materials_sku_idx').on(t.sku),
    index('materials_category_idx').on(t.categoryId),
    index('materials_base_uom_idx').on(t.baseUomId),
    // Removed: materials_type_idx — enum with only 2 values, low selectivity
  ]
)

// ─── Material Conversions ─────────────────────────────────────────────────────
// MongoDB embedded `material.conversions[]` → proper table in SQL.
// Stores UOM conversion factors relative to the material's base UOM.

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
    ...metadata,
  },
  (t) => [
    uniqueIndex('material_conversions_material_uom_idx').on(t.materialId, t.uomId),
    index('material_conversions_uom_idx').on(t.uomId),
  ]
)

// ─── Material Locations ───────────────────────────────────────────────────────
// Junction between materials and locations with per-location config + stock snapshot.

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
    minStock: integer().notNull().default(0),
    maxStock: integer(),
    reorderPoint: integer().notNull().default(0),

    // Current stock snapshot (maintained by inventory module)
    currentQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    currentAvgCost: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    currentValue: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

    ...metadata,
  },
  (t) => [
    // Unique: one entry per material per location
    uniqueIndex('material_locations_material_location_idx').on(t.materialId, t.locationId),
    // Standalone index for "list all materials at location X" queries
    index('material_locations_location_idx').on(t.locationId),
    // Removed: material_locations_material_idx — redundant, covered by composite unique above
  ]
)
