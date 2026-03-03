import { index, integer, numeric, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { materialTypeEnum, metadata, pk } from './_helpers'

// ─── UOM (Unit of Measure) ────────────────────────────────────────────────────

export const uoms = pgTable(
  'uoms',
  {
    ...pk,
    code: text().notNull(),
    ...metadata,
  },
  (t) => [uniqueIndex('uoms_code_idx').on(t.code)]
)

// ─── Material Categories ──────────────────────────────────────────────────────

export const materialCategories = pgTable(
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

export const materials = pgTable(
  'materials',
  {
    ...pk,
    name: text().notNull(),
    description: text(),
    sku: text().notNull(),
    type: materialTypeEnum().notNull(),
    categoryId: uuid(),
    baseUom: text().notNull(),
    ...metadata,
  },
  (t) => [
    uniqueIndex('materials_name_idx').on(t.name),
    uniqueIndex('materials_sku_idx').on(t.sku),
    index('materials_type_idx').on(t.type),
    index('materials_category_idx').on(t.categoryId),
  ]
)

// ─── Material Conversions ─────────────────────────────────────────────────────
// MongoDB embedded `material.conversions[]` → proper table in SQL.
// Stores UOM conversion factors relative to the material's base UOM.

export const materialConversions = pgTable(
  'material_conversions',
  {
    ...pk,
    materialId: uuid().notNull(),
    uom: text().notNull(),
    factor: numeric({ precision: 18, scale: 6 }).notNull(),
  },
  (t) => [
    uniqueIndex('material_conversions_material_uom_idx').on(t.materialId, t.uom),
    index('material_conversions_material_idx').on(t.materialId),
  ]
)

// ─── Material Locations ───────────────────────────────────────────────────────
// Junction between materials and locations with per-location config + stock snapshot.

export const materialLocations = pgTable(
  'material_locations',
  {
    ...pk,
    materialId: uuid().notNull(),
    locationId: uuid().notNull(),

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
    uniqueIndex('material_locations_material_location_idx').on(t.materialId, t.locationId),
    index('material_locations_location_idx').on(t.locationId),
    index('material_locations_material_idx').on(t.materialId),
  ]
)
