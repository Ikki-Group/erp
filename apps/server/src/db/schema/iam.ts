import { sql } from 'drizzle-orm'
import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers'
import { locationsTable } from './location.ts'

/**
 * Roles Table
 *
 * Defines a named permission set assignable to users per location.
 *
 * `code`      — stable, normalized (slug-like) machine identifier derived from
 *               `name`. Used in application logic and seeding. Never changes
 *               after creation.
 *
 * `isBuiltIn` — true for roles created by the system seeder. Built-in roles
 *               are protected from mutation and deletion by the service layer.
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
		isSystem: boolean('is_built_in').notNull().default(false),
		...auditBasicColumns,
	},
	(t) => [uniqueIndex('roles_code_idx').on(t.code)],
)

/**
 * Users Table
 *
 * Core identity entity. Covers both human operators and built-in service
 * accounts (seeded by the system).
 *
 * `isRoot`     — grants implicit superadmin access to all locations.
 *                Root users bypass assignment checks entirely.
 *
 * `isBuiltIn`  — true for accounts created by the system seeder (e.g. the
 *                default superadmin). Not operator-created. Protected from
 *                deletion by the service layer.
 *
 * `isActive`   — soft-disable without deletion. Inactive users must be
 *                rejected at the session/auth layer on every request.
 *
 * `defaultLocationId`
 *   Root users   → optional preference. Null = no preference set.
 *                  Can be set to any location (implicit access everywhere).
 *                  Only updated via explicit setDefaultLocation() call.
 *
 *   Non-root     → auto-managed by UserAssignmentRepo:
 *                  - Set to first location on first assignment.
 *                  - Promoted to oldest remaining assignment when default is removed.
 *                  - Cleared (null) when all assignments are removed.
 *                  Can also be set explicitly (validated against assignments).
 *
 *   onDelete: 'set null' — location hard-delete must not be blocked by user
 *   preference. Caller must handle null defaultLocationId at login.
 *
 * Constraint: `is_root` and `is_built_in` are not mutually exclusive —
 * a seeded root account is both. But a root user is never a regular operator,
 * so no check constraint is needed between those two flags.
 */
export const usersTable = pgTable(
	'users',
	{
		...pk,
		email: text('email').notNull(),
		username: text('username').notNull(),
		fullname: text('fullname').notNull(),
		pinCode: text('pin_code'),

		/**
		 * Null for isBuiltIn service accounts that authenticate via other means
		 * (e.g. API tokens). Always set for human operator accounts.
		 */
		passwordHash: text('password_hash'),

		isRoot: boolean('is_root').notNull().default(false),
		isSystem: boolean('is_built_in').notNull().default(false),
		isActive: boolean('is_active').notNull().default(true),

		defaultLocationId: integer('default_location_id').references(() => locationsTable.id, {
			onDelete: 'set null',
		}),

		lastLoginAt: timestamp('last_login_at', { mode: 'date', withTimezone: true }),

		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('users_email_idx').on(t.email),
		uniqueIndex('users_username_idx').on(t.username),
		index('users_default_location_idx').on(t.defaultLocationId),

		// // Root users are never built-in service accounts (and vice versa).
		// // A seeded root admin is isRoot=true, isBuiltIn=true — that's valid.
		// // What's invalid: a non-human service account having root privileges.
		// check(
		// 	'users_root_not_service_chk',
		// 	sql`NOT (is_root AND NOT is_built_in AND password_hash IS NULL)`,
		// ),
	],
)

/**
 * User Assignments Table  (LBAC join: User ↔ Role ↔ Location)
 *
 * Grants a user a specific role at a specific location.
 *
 * Business rules:
 *   - Root users  : assignments are optional. Root has implicit superadmin
 *                   access to all locations. A row here only exists when a
 *                   root user needs a non-superadmin role at a specific location.
 *   - Non-root    : access is strictly limited to locations with a row here.
 *   - One role per user per location (unique on userId + locationId).
 *
 * `effectiveTo`   — optional expiry for time-bounded access (contractors,
 *                   temporary grants). Null = indefinite. A background job or
 *                   session-validation layer must enforce this.
 *
 * `addedBy`       — audit trail for who created the assignment.
 *                   onDelete: 'set null' so deleting a user does not block
 *                   or cascade-destroy assignments they previously created.
 *
 * onDelete behaviour:
 *   userId     → cascade  : user gone, assignments gone.
 *   roleId     → restrict : cannot delete a role in active use.
 *   locationId → restrict : cannot delete a location with active assignments.
 *                           Service layer must clear assignments before retiring
 *                           a location.
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

		addedAt: timestamp('added_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
		addedBy: integer('added_by').references(() => usersTable.id, {
			onDelete: 'set null',
		}),
	},
	(t) => [
		index('user_assignments_user_idx').on(t.userId),
		index('user_assignments_role_idx').on(t.roleId),
		index('user_assignments_location_idx').on(t.locationId),

		// One role per location per user — natural key of this table.
		uniqueIndex('user_assignments_user_location_idx').on(t.userId, t.locationId),
	],
)
