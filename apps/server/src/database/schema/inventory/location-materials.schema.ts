import { boolean, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { dbSchema } from '../db-schema'
import { locations } from '../location/locations.schema'
import { materials } from './materials.schema'

/**
 * Location Materials Table
 *
 * Defines which materials are available at which locations.
 * This is a many-to-many relationship table between locations and materials.
 *
 * Business Rules:
 * - Materials with type 'raw' or 'semi' are automatically assigned to all WAREHOUSE locations
 * - Materials can be manually assigned to STORE locations as needed
 * - OFFICE and FACTORY locations typically don't store materials
 *
 * Use Cases:
 * - Track material availability across warehouses
 * - Control which stores can access specific materials
 * - Generate location-specific material lists
 */
export const locationMaterials = dbSchema.table(
  'location_materials',
  {
    id: uuid().primaryKey().defaultRandom(),

    locationId: uuid()
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),

    materialId: uuid()
      .notNull()
      .references(() => materials.id, { onDelete: 'cascade' }),

    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('uq_location_material').on(t.locationId, t.materialId)]
)
