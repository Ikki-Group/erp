import { isNull } from 'drizzle-orm'
import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { locationClassificationEnum, locationTypeEnum } from './_helpers'

/**
 * Locations Table (Layer 0)
 *
 * Represents physical and virtual outlets, stores, or warehouses.
 * Almost all transactional data in the ERP references a Location.
 */
export const locationsTable = pgTable(
  'locations',
  {
    ...pk,
    code: text('code').notNull(),
    name: text('name').notNull(),
    type: locationTypeEnum('type').notNull(),
    classification: locationClassificationEnum('classification').notNull().default('physical'),
    address: text('address'),
    phone: text('phone'),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('locations_code_idx').on(t.code).where(isNull(t.deletedAt)),
    uniqueIndex('locations_name_idx').on(t.name).where(isNull(t.deletedAt)),
  ],
)
