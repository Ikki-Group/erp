import { boolean, pgTable, serial, text, unique, varchar } from 'drizzle-orm/pg-core'

import { metafields } from './common'
import { locationType } from './enum'

/**
 * LOCATIONS
 * toko, gudang pusat, gudang toko, dll
 */
export const locations = pgTable(
  'locations',
  {
    id: serial().primaryKey(),
    code: varchar({ length: 50 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    type: locationType().notNull(),
    description: text(),
    isActive: boolean().default(true).notNull(),
    ...metafields,
  },
  (table) => [unique().on(table.code)]
)

// Type exports
export type Location = typeof locations.$inferSelect
export type NewLocation = typeof locations.$inferInsert
export type LocationUpdate = Partial<NewLocation>
