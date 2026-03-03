import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { metadata, pk } from './_helpers'

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
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

export const roles = pgTable(
  'roles',
  {
    ...pk,
    code: text().notNull(),
    name: text().notNull(),
    isSystem: boolean().notNull().default(false),
    ...metadata,
  },
  (t) => [uniqueIndex('roles_code_idx').on(t.code), uniqueIndex('roles_name_idx').on(t.name)]
)

// ─── User Assignments ────────────────────────────────────────────────────────
// MongoDB embedded `user.assignments[]` → proper junction table in SQL.
// Each row means "user X has role Y at location Z".

export const userAssignments = pgTable(
  'user_assignments',
  {
    ...pk,
    userId: uuid().notNull(),
    roleId: uuid().notNull(),
    locationId: uuid().notNull(),
    isDefault: boolean().notNull().default(false),
  },
  (t) => [
    uniqueIndex('user_assignments_user_role_location_idx').on(t.userId, t.roleId, t.locationId),
    index('user_assignments_user_idx').on(t.userId),
    index('user_assignments_role_idx').on(t.roleId),
    index('user_assignments_location_idx').on(t.locationId),
  ]
)

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessions = pgTable(
  'sessions',
  {
    ...pk,
    userId: uuid().notNull(),
    createdAt: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
    expiredAt: timestamp({ mode: 'date', withTimezone: true }).notNull(),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expired_at_idx').on(t.expiredAt)]
)
