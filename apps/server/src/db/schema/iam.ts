import { sql } from 'drizzle-orm'
import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from '@/core/database/schema'

import { locationsTable } from './location'

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
		isSystem: boolean('is_system').notNull().default(false),
		isActive: boolean('is_active').notNull().default(true),

		/**
		 * Default active location untuk session awal login.
		 *
		 * Root user   → nullable; null = belum pernah set preferensi.
		 *               Bisa di-set ke lokasi manapun (akses root implicit ke semua).
		 *               Diatur manual via setDefaultLocation(), TIDAK auto-sync.
		 *
		 * Non-root    → auto-managed oleh UserAssignmentRepo:
		 *               - Auto-set ke lokasi pertama saat assignment pertama dibuat.
		 *               - Auto-promote ke assignment tertua jika default-nya dihapus.
		 *               - Di-clear (null) jika semua assignment dihapus.
		 *
		 * onDelete: 'set null' — jika lokasi di-hard-delete, null dulu;
		 * jangan blokir delete lokasi hanya karena ada user yang default ke sana.
		 * Caller wajib handle null defaultLocationId saat login.
		 */
		defaultLocationId: integer('default_location_id').references(() => locationsTable.id, {
			onDelete: 'set null',
		}),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('users_email_idx').on(t.email),
		uniqueIndex('users_username_idx').on(t.username),
		index('users_default_location_idx').on(t.defaultLocationId),
	],
)

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
		...auditBasicColumns,
	},
	(t) => [uniqueIndex('roles_code_idx').on(t.code), uniqueIndex('roles_name_idx').on(t.name)],
)

/**
 * Join table: User ←→ Role ←→ Location  (LBAC).
 *
 * Aturan bisnis:
 *   - Root user  : akses implicit ke semua lokasi sebagai superadmin.
 *                  Rows di sini bersifat OPSIONAL — hanya dibuat jika root
 *                  membutuhkan role non-superadmin di lokasi tertentu.
 *   - Non-root   : HANYA bisa akses lokasi yang ada row-nya di sini.
 *   - Satu user  : tepat satu role per lokasi
 *                  (unique constraint userId + locationId).
 *   - isDefault  : DIPINDAH ke usersTable.defaultLocationId — lebih atomic,
 *                  tidak butuh 2-row update, dan cover root user.
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

		/**
		 * Siapa yang menambahkan assignment ini.
		 * set null (bukan restrict) agar delete user tidak diblokir
		 * karena dia pernah assign orang lain.
		 */
		addedBy: integer('added_by').references(() => usersTable.id, { onDelete: 'set null' }),
	},
	(t) => [
		index('user_assignments_user_idx').on(t.userId),
		index('user_assignments_role_idx').on(t.roleId),
		index('user_assignments_location_idx').on(t.locationId),

		// Satu role per lokasi per user — natural key table ini.
		uniqueIndex('user_assignments_user_location_idx').on(t.userId, t.locationId),
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
	(t) => [
		index('sessions_user_idx').on(t.userId),
		index('sessions_expired_at_idx').on(t.expiredAt),
	],
)
