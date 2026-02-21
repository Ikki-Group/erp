import { boolean, integer, pgTable, primaryKey, serial, timestamp, unique, varchar } from 'drizzle-orm/pg-core'

import { metafields } from './common'
import { locations } from './locations'

export const users = pgTable(
  'users',
  {
    id: serial().primaryKey(),
    email: varchar({ length: 255 }).notNull(),
    username: varchar({ length: 255 }).notNull(),
    fullname: varchar({ length: 255 }).notNull(),
    passwordHash: varchar({ length: 255 }).notNull(),
    isRoot: boolean().default(false).notNull(),
    isActive: boolean().default(true).notNull(),
    ...metafields,
  },
  (t) => [unique().on(t.email), unique().on(t.username)]
)

export const roles = pgTable(
  'roles',
  {
    id: serial().primaryKey(),
    code: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    isSystem: boolean().default(false).notNull(),
    ...metafields,
  },
  (t) => [unique().on(t.code), unique().on(t.name)]
)

export const userAssignments = pgTable(
  'user_assignments',
  {
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer()
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    locationId: integer()
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    isDefault: boolean().default(false).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId, t.locationId] })]
)

export const userSessions = pgTable(
  'user_sessions',
  {
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar({ length: 255 }).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    expiresAt: timestamp().notNull(),
  },
  (t) => [unique().on(t.token)]
)
