import { isNull } from 'drizzle-orm'
import { pgTable, text, uniqueIndex, boolean } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { locationTypeEnum } from './_helpers'

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
    description: text('description'),
    address: text('address'),
    phone: text('phone'),
    isActive: boolean('is_active').notNull().default(true),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('locations_code_idx').on(t.code).where(isNull(t.deletedAt)),
    uniqueIndex('locations_name_idx').on(t.name).where(isNull(t.deletedAt)),
  ],
)
