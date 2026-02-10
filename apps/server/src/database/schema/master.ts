import { boolean, pgTable, varchar } from 'drizzle-orm/pg-core'

import { metafields } from './common'

export const uoms = pgTable('uoms', {
  code: varchar({ length: 50 }).notNull().primaryKey(),
  isActive: boolean().default(true).notNull(),
  ...metafields,
})
