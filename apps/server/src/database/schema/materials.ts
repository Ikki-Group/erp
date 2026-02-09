import { boolean, decimal, integer, pgTable, serial, text, unique, varchar } from 'drizzle-orm/pg-core'

import { metafields } from './common'
import { materialType } from './enum'
import { locations } from './locations'

/**
 * MATERIAL CATEGORIES
 * Kategori bahan baku untuk memudahkan pencarian (flat structure, optional)
 */
export const materialCategories = pgTable(
  'material_categories',
  {
    id: serial().primaryKey(),
    code: varchar({ length: 50 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    isActive: boolean().default(true).notNull(),
    ...metafields,
  },
  (table) => [unique().on(table.code)]
)

/**
 * UNITS OF MEASURE (UOM)
 * Master data satuan global (kg, gram, liter, pcs, box, dll)
 */
export const unitsOfMeasure = pgTable(
  'units_of_measure',
  {
    id: serial().primaryKey(),
    code: varchar({ length: 50 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    symbol: varchar({ length: 20 }).notNull(),
    isActive: boolean().default(true).notNull(),
    ...metafields,
  },
  (table) => [unique().on(table.code), unique().on(table.symbol)]
)

/**
 * UOM CONVERSIONS
 * Tabel konversi antar UOM (e.g., 1 kg = 1000 gram)
 * conversionFactor: berapa banyak toUom dalam 1 fromUom
 * Example: fromUom=kg, toUom=gram, conversionFactor=1000 (1 kg = 1000 gram)
 */
export const uomConversions = pgTable(
  'uom_conversions',
  {
    id: serial().primaryKey(),
    fromUomId: integer()
      .notNull()
      .references(() => unitsOfMeasure.id, { onDelete: 'restrict' }),
    toUomId: integer()
      .notNull()
      .references(() => unitsOfMeasure.id, { onDelete: 'restrict' }),
    conversionFactor: decimal({ precision: 20, scale: 6 }).notNull(),
    ...metafields,
  },
  (table) => [unique().on(table.fromUomId, table.toUomId)]
)

/**
 * MATERIALS
 * Master data bahan baku global (raw & semi-finished)
 * SKU auto-generate jika tidak diisi: RM-{type}-{sequence}
 */
export const materials = pgTable(
  'materials',
  {
    id: serial().primaryKey(),
    sku: varchar({ length: 100 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    type: materialType().notNull(),
    categoryId: integer().references(() => materialCategories.id, { onDelete: 'set null' }),
    isActive: boolean().default(true).notNull(),
    ...metafields,
  },
  (table) => [unique().on(table.sku)]
)

/**
 * MATERIAL UNITS
 * Junction table: material dapat memiliki beberapa UOM
 * Hanya 1 base unit per material (enforced via application logic)
 */
export const materialUnits = pgTable(
  'material_units',
  {
    id: serial().primaryKey(),
    materialId: integer()
      .notNull()
      .references(() => materials.id, { onDelete: 'cascade' }),
    uomId: integer()
      .notNull()
      .references(() => unitsOfMeasure.id, { onDelete: 'restrict' }),
    isBaseUnit: boolean().default(false).notNull(),
    ...metafields,
  },
  (table) => [unique().on(table.materialId, table.uomId)]
)

/**
 * LOCATION MATERIALS
 * Assignment material ke location + konfigurasi per location
 * - Auto-assigned untuk warehouse/central_warehouse
 * - Manual assignment untuk store
 * - stockAlertThreshold: minimum stock level untuk alert
 * - weightedAvgCost: weighted average cost per location (calculated by inventory/costing module)
 */
export const locationMaterials = pgTable(
  'location_materials',
  {
    id: serial().primaryKey(),
    locationId: integer()
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    materialId: integer()
      .notNull()
      .references(() => materials.id, { onDelete: 'cascade' }),
    stockAlertThreshold: decimal({ precision: 20, scale: 6 }).default('0'),
    weightedAvgCost: decimal({ precision: 20, scale: 6 }).default('0'),
    isActive: boolean().default(true).notNull(),
    ...metafields,
  },
  (table) => [unique().on(table.locationId, table.materialId)]
)
