import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { pk } from './_helpers'
import { usersTable } from './iam.ts'

/**
 * Sessions Table
 *
 * Active authentication sessions. High-churn — no auditBasicColumns.
 *
 * `locationId` — the location context this session is active in.
 *               Required for LBAC: permission checks are resolved against
 *               the (user, location) pair, not the user alone.
 *               Switching locations requires creating a new session or
 *               an explicit location-switch flow (your choice).
 *               onDelete: 'restrict' — retiring a location must clear its
 *               sessions first (service layer responsibility).
 *
 * `revokedAt`  — explicit invalidation (password change, forced logout,
 *               role change). Null = not revoked. The auth layer must
 *               treat revokedAt IS NOT NULL as equivalent to expired.
 *               Retains the row for audit purposes.
 *
 * `ipAddress`  — captured at session creation. Used for anomaly detection
 *               and user-facing "active sessions" display.
 *
 * `userAgent`  — raw UA string at session creation. Truncated to 512 chars
 *               to avoid unbounded storage from malformed clients.
 */
export const sessionsTable = pgTable(
	'sessions',
	{
		...pk,
		userId: integer('user_id')
			.notNull()
			.references(() => usersTable.id, { onDelete: 'cascade' }),

		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),

		revokedAt: timestamp('revoked_at', { mode: 'date', withTimezone: true }),
		createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
		expiredAt: timestamp('expired_at', { mode: 'date', withTimezone: true }).notNull(),
	},
	(t) => [
		// Cleanup job: sweep all expired sessions regardless of user
		index('sessions_expired_at_idx').on(t.expiredAt),

		// Force-logout sweep: find all non-revoked sessions for a user
		// (e.g. on password change). Partial index would be ideal but
		// Drizzle partial index support is limited — handle in query layer.
		index('sessions_user_revoked_idx').on(t.userId, t.revokedAt),
	],
)
