import { boolean, decimal, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { dbSchema } from '../db-schema'
import { materials } from './materials.schema'
import { uoms } from './uoms.schema'

/**
 * Material UOMs Table
 *
 * Defines the relationship between materials and their units of measure (UOMs).
 * Each material can have multiple UOMs with conversion factors relative to the base UOM.
 *
 * Example:
 * - Material: "Steel Plate" with base UOM "kg"
 * - Additional UOMs: "g" (factor: 0.001), "ton" (factor: 1000)
 *
 * This allows flexible quantity conversions across different units.
 */
export const materialUoms = dbSchema.table(
  'material_uoms',
  {
    id: uuid().primaryKey().defaultRandom(),

    materialId: uuid()
      .notNull()
      .references(() => materials.id, { onDelete: 'cascade' }),

    uomId: uuid()
      .notNull()
      .references(() => uoms.id, { onDelete: 'restrict' }),

    /**
     * Conversion factor to base UOM
     *
     * Formula: quantity_in_base_uom = quantity_in_this_uom * conversionFactor
     *
     * Examples (base UOM = kg):
     * - 1 kg = 1.0 (base UOM always has factor 1.0)
     * - 1 g = 0.001 (1 gram = 0.001 kg)
     * - 1 ton = 1000.0 (1 ton = 1000 kg)
     */
    conversionFactor: decimal({ precision: 15, scale: 6 }).notNull(),

    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('uq_material_uom').on(t.materialId, t.uomId)]
)
