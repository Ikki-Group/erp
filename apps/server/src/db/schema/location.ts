import { boolean, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { locationTypeEnum, metadata, pk } from './_helpers'

// ─── Locations ────────────────────────────────────────────────────────────────

export const locationsTable = pgTable(
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
  (t) => [uniqueIndex('locations_code_idx').on(t.code), uniqueIndex('locations_name_idx').on(t.name)],
)
