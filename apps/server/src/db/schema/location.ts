import { boolean, index, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { locationTypeEnum, metadata, pk } from './_helpers'

// ─── Locations ────────────────────────────────────────────────────────────────

export const locations = pgTable(
  'locations',
  {
    ...pk,
    code: text().notNull(),
    name: text().notNull(),
    type: locationTypeEnum().notNull(),
    description: text(),
    isActive: boolean().notNull().default(true),
    ...metadata,
  },
  (t) => [
    uniqueIndex('locations_code_idx').on(t.code),
    uniqueIndex('locations_name_idx').on(t.name),
    index('locations_type_idx').on(t.type),
    index('locations_is_active_idx').on(t.isActive),
  ]
)
