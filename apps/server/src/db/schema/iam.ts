import { sql } from 'drizzle-orm'
import {
	pgTable,
	varchar,
	integer,
	jsonb,
	timestamp,
	index,
	uniqueIndex,
	boolean,
} from 'drizzle-orm/pg-core'

import { pk, auditBasicColumns } from './_helpers.ts'
import { locations } from './core.ts'

// ─── Roles ───

export const roles = pgTable(
	'roles',
	{
		...pk,
		code: varchar('code', { length: 50 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		description: varchar('description', { length: 500 }).notNull().default(''),
		isSystem: boolean('is_system').notNull().default(false),
		permissions: jsonb('permissions').notNull().default([]),
		...auditBasicColumns,
	},
	(t) => [uniqueIndex('roles_code_uniq').on(t.code)],
)

// ─── Users ───

export const users = pgTable(
	'users',
	{
		...pk,
		username: varchar('username', { length: 100 }).notNull(),
		email: varchar('email', { length: 255 }).notNull(),
		passwordHash: varchar('password_hash', { length: 500 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		isActive: boolean('is_active').notNull().default(true),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('users_username_uniq').on(t.username),
		uniqueIndex('users_email_uniq').on(t.email),
	],
)

// ─── User Assignments ───

export const userAssignments = pgTable(
	'user_assignments',
	{
		...pk,
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		roleId: integer('role_id')
			.notNull()
			.references(() => roles.id, { onDelete: 'restrict' }),
		locationId: integer('location_id').references(() => locations.id, { onDelete: 'restrict' }),
	},
	(t) => [
		uniqueIndex('user_assignments_user_location_uniq')
			.on(t.userId, t.locationId)
			.where(sql`${t.locationId} is not null`),
		uniqueIndex('user_assignments_user_role_global_uniq')
			.on(t.userId, t.roleId)
			.where(sql`${t.locationId} is null`),
		index('user_assignments_user_id_idx').on(t.userId),
		index('user_assignments_role_id_idx').on(t.roleId),
		index('user_assignments_location_id_idx').on(t.locationId),
	],
)

// ─── Sessions ───

export const sessions = pgTable(
	'sessions',
	{
		id: varchar('id', { length: 255 }).primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		userAgent: varchar('user_agent', { length: 500 }),
		ipAddress: varchar('ip_address', { length: 100 }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		revokedAt: timestamp('revoked_at', { withTimezone: true }),
	},
	(t) => [index('sessions_user_id_idx').on(t.userId)],
)
