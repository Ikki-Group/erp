import { isNull } from 'drizzle-orm'
import { boolean, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { locationClassificationEnum, locationTypeEnum, metadata, pk } from './_helpers'

// ─── Locations ────────────────────────────────────────────────────────────────

export const locationsTable = pgTable(
  'locations',
  {
    ...pk,
    code: text().notNull(),
    name: text().notNull(),
    type: locationTypeEnum().notNull(),
    classification: locationClassificationEnum().notNull().default('physical'),
    description: text(),
    isActive: boolean().notNull().default(true),
    ...metadata,
  },
  (t) => [
    uniqueIndex('locations_code_idx').on(t.code).where(isNull(t.deletedAt)),
    uniqueIndex('locations_name_idx').on(t.name).where(isNull(t.deletedAt)),
  ],
)
