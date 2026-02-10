import { boolean, decimal, integer, pgTable, serial, text, unique, varchar } from 'drizzle-orm/pg-core'

import { uoms } from '@/database/schema/master'

import { metafields } from './common'
import { materialType } from './enum'
import { locations } from './locations'

/**
 * MATERIAL CATEGORIES
 * Kategori bahan baku untuk memudahkan pencarian (flat structure, optional)
 */
export const materialCategories = pgTable('material_categories', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  isActive: boolean().default(true).notNull(),
  ...metafields,
})

/**
 * MATERIAL UOMS
 * Junction table: material dapat memiliki beberapa UOM
 * Hanya 1 base unit per material (enforced via application logic)
 */
export const materialUoms = pgTable('material_uoms', {
  materialId: integer()
    .notNull()
    .references(() => materials.id, { onDelete: 'cascade' }),
  uom: varchar({ length: 50 })
    .notNull()
    .references(() => uoms.code, { onDelete: 'restrict' }),
  isBase: boolean().default(false).notNull(),
  ...metafields,
})

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
    baseUom: varchar({ length: 50 })
      .notNull()
      .references(() => uoms.code, { onDelete: 'restrict' }),
    ...metafields,
  },
  (table) => [unique().on(table.sku)]
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
