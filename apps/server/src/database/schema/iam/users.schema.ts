import { boolean, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { dbSchema } from '../db-schema'

export const users = dbSchema.table('users', {
  id: uuid().primaryKey().defaultRandom(),

  username: varchar({ length: 50 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),

  passwordHash: varchar({ length: 255 }).notNull(),

  fullName: varchar({ length: 255 }).notNull(),
  displayName: varchar({ length: 255 }),

  isActive: boolean().notNull().default(true),
  isDeleted: boolean().notNull().default(false),
  lastLoginAt: timestamp({ withTimezone: true }),

  deletedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
