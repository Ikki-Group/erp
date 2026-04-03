import { isNull, sql } from 'drizzle-orm'
import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { locationsTable } from './location'

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * Users Table (Layer 1)
 *
 * Core Identity entity. Includes primary authentication attributes.
 * Linked to a set of locations and roles via UserAssignments.
 */
export const usersTable = pgTable(
  'users',
  {
    ...pk,
    email: text('email').notNull(),
    username: text('username').notNull(),
    fullname: text('fullname').notNull(),
    passwordHash: text('password_hash').notNull(),
    /** Optional for fast POS terminal logins */
    pinCode: text('pin_code'),
    isRoot: boolean('is_root').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('users_email_idx').on(t.email).where(isNull(t.deletedAt)),
    uniqueIndex('users_username_idx').on(t.username).where(isNull(t.deletedAt)),
  ],
)

// ─── Roles ────────────────────────────────────────────────────────────────────

/**
 * Roles Table (Layer 1)
 *
 * Defines a set of permissions. Roles are assigned to users per location.
 */
export const rolesTable = pgTable(
  'roles',
  {
    ...pk,
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    permissions: text('permissions')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    isSystem: boolean('is_system').notNull().default(false),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('roles_code_idx').on(t.code).where(isNull(t.deletedAt)),
    uniqueIndex('roles_name_idx').on(t.name).where(isNull(t.deletedAt)),
  ],
)

// ─── User Assignments ────────────────────────────────────────────────────────

/**
 * User Assignments Table (Layer 1)
 *
 * Join table mapping Users to Roles at specific Locations (LBAC).
 * Enforces the "One user can have multiple roles in different locations" rule.
 */
export const userAssignmentsTable = pgTable(
  'user_assignments',
  {
    ...pk,
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'restrict' }),
    locationId: integer('location_id')
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),
    isDefault: boolean('is_default').notNull().default(false),
    ...auditColumns,
  },
  (t) => [
    index('user_assignments_user_idx').on(t.userId),
    index('user_assignments_role_idx').on(t.roleId),
    index('user_assignments_location_idx').on(t.locationId),
    uniqueIndex('user_assignments_user_role_location_idx').on(t.userId, t.roleId, t.locationId),
  ],
)

// ─── Sessions ─────────────────────────────────────────────────────────────────

/**
 * Sessions Table (Layer 1)
 *
 * Active authentication sessions. Linked to a User.
 * Does not use auditColumns as it is transient/high-churn.
 */
export const sessionsTable = pgTable(
  'sessions',
  {
    ...pk,
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    expiredAt: timestamp('expired_at', { mode: 'date', withTimezone: true }).notNull(),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expired_at_idx').on(t.expiredAt)],
)
