import { boolean, integer, pgTable, serial, timestamp, unique, varchar } from 'drizzle-orm/pg-core'

import { metafields } from './common'

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

export const userRoleAssignments = pgTable(
  'user_role_assignments',
  {
    id: serial().primaryKey(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer()
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    locationId: integer().notNull(),
    assignedAt: timestamp().defaultNow().notNull(),
    assignedBy: integer().notNull(),
  },
  (t) => [unique().on(t.userId, t.locationId)]
)

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserUpdate = Partial<NewUser>

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
export type RoleUpdate = Partial<NewRole>

export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect
export type NewUserRoleAssignment = typeof userRoleAssignments.$inferInsert
export type UserRoleAssignmentUpdate = Partial<NewUserRoleAssignment>
