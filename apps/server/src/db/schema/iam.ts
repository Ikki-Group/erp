import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { roleScopeEnum } from './_enums'
import { auditBasicColumns, pk } from './_helpers'
import { locationsTable } from './location'

/**
 * Roles Table
 *
 * Defines a named permission set assignable to users per location.
 *
 * `code`       — stable, normalized (slug-like) machine identifier derived from
 *                `name`. Used in application logic and seeding. Never changes
 *                after creation. Globally unique.
 *
 * `scope`      — determines where the role's permissions apply:
 *                - `global`: access to ALL locations without assignment rows.
 *                  Reserved for the OWNER role.
 *                - `location`: access only where user has assignment rows.
 *
 * `isSystem`   — true for roles created by the system seeder. Built-in roles
 *                are protected from mutation and deletion by the service layer.
 *
 * `permissions` — array of permission strings (e.g., "iam.user.read").
 *                 Validation enforced at application layer (Zod schema).
 *                 `['*']` means all permissions (OWNER role).
 */
export const rolesTable = pgTable(
	'roles',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		description: text('description'),
		scope: roleScopeEnum('scope').notNull().default('location'),
		permissions: text('permissions').array().notNull().default([]),
		isSystem: boolean('is_system').notNull().default(false),
		...auditBasicColumns,
	},
	(t) => [uniqueIndex('roles_code_idx').on(t.code)],
)

/**
 * Users Table
 *
 * Core identity entity. Covers both human operators (owner + staff).
 *
 * Access control is determined entirely by role assignments:
 *   - A user with a GLOBAL-scoped role (e.g. OWNER) has access to all locations.
 *   - A user with only LOCATION-scoped roles has access only to assigned locations.
 *
 * `isActive`   — soft-disable without deletion. Inactive users must be
 *                rejected at the session/auth layer on every request.
 *
 * `defaultLocationId`
 *   Global-scope users → optional preference. Null = no preference set.
 *                         Can be set to any location (implicit access everywhere).
 *
 *   Location-scope     → auto-managed by UserAssignmentRepo:
 *                         - Set to first location on first assignment.
 *                         - Promoted to oldest remaining assignment when default is removed.
 *                         - Cleared (null) when all assignments are removed.
 *                         Can also be set explicitly (validated against assignments).
 *
 *   onDelete: 'set null' — location hard-delete must not be blocked by user
 *   preference. Caller must handle null defaultLocationId at login.
 *
 * `lastLoginAt` — timestamp of last successful login. Updated on each login.
 *                 Used for "last seen" display and inactive user cleanup.
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
		 * Null for service accounts that authenticate via other means
		 * (e.g. API tokens). Always set for human operator accounts.
		 */
		passwordHash: text('password_hash'),

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
		index('users_active_idx').on(t.isActive),
	],
)

/**
 * User Assignments Table  (LBAC join: User ↔ Role ↔ Location)
 *
 * Grants a user a specific role at a specific location.
 *
 * Business rules:
 *   - Users with a GLOBAL-scoped role: assignments are optional. They have
 *     implicit access to all locations. A row here only exists as default
 *     location preference.
 *   - Users with only LOCATION-scoped roles: access is strictly limited to
 *     locations with a row here.
 *   - One role per user per location (unique on userId + locationId).
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
		index('user_assignments_added_by_idx').on(t.addedBy),

		// One role per location per user — natural key of this table.
		uniqueIndex('user_assignments_user_location_idx').on(t.userId, t.locationId),
	],
)
