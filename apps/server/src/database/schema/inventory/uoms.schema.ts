import { boolean, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { dbSchema } from '../db-schema'

export const uoms = dbSchema.table('uoms', {
  id: uuid().primaryKey().defaultRandom(),

  code: varchar({ length: 20 }).notNull().unique(),
  name: varchar({ length: 100 }).notNull(),
  symbol: varchar({ length: 10 }),

  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
