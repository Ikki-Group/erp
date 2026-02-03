import { boolean, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { dbSchema } from '../db-schema'
import { materialTypeEnum } from '../shared-enums'
import { uoms } from './uoms.schema'

export const materials = dbSchema.table('materials', {
  id: uuid().primaryKey().defaultRandom(),

  code: varchar({ length: 50 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  type: materialTypeEnum().notNull(), // 'raw' or 'semi'
  description: text(),

  baseUomId: uuid()
    .notNull()
    .references(() => uoms.id, { onDelete: 'restrict' }),

  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
