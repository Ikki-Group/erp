import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { metadata, pk } from './_helpers'
import { locationsTable } from './location'

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersTable = pgTable(
  'users',
  {
    ...pk,
    email: text().notNull(),
    username: text().notNull(),
    fullname: text().notNull(),
    passwordHash: text().notNull(),
    isRoot: boolean().notNull().default(false),
    isActive: boolean().notNull().default(true),
    ...metadata,
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email), uniqueIndex('users_username_idx').on(t.username)]
)

// ─── Roles ────────────────────────────────────────────────────────────────────

export const rolesTable = pgTable(
  'roles',
  {
    ...pk,
    code: text().notNull(),
    name: text().notNull(),
    description: text(),
    isSystem: boolean().notNull().default(false),
    ...metadata,
  },
  (t) => [uniqueIndex('roles_code_idx').on(t.code), uniqueIndex('roles_name_idx').on(t.name)]
)

// ─── User Assignments ────────────────────────────────────────────────────────

export const userAssignmentsTable = pgTable(
  'user_assignments',
  {
    ...pk,
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    roleId: integer()
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'restrict' }),
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),
    isDefault: boolean().notNull().default(false),
    ...metadata,
  },
  (t) => [
    // Standalone indexes for reverse lookups (composite unique already covers userId-leading queries)
    index('user_assignments_user_idx').on(t.userId),
    index('user_assignments_role_idx').on(t.roleId),
    index('user_assignments_location_idx').on(t.locationId),
    // Composite unique: a user can only have ONE assignment per role+location combo
    uniqueIndex('user_assignments_user_role_location_idx').on(t.userId, t.roleId, t.locationId),
  ]
)

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsTable = pgTable(
  'sessions',
  {
    ...pk,
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
    expiredAt: timestamp({ mode: 'date', withTimezone: true }).notNull(),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expired_at_idx').on(t.expiredAt)]
)
