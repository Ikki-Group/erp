import { index, integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

import { pk } from './_helpers'
import { locationsTable } from './location.ts'
import { usersTable } from './iam.ts'

/**
 * Sessions Table
 *
 * Active authentication sessions. High-churn — no auditBasicColumns.
 *
 * `userId`     — WHO is authenticated. Cascades on user deletion.
 *
 * `locationId` — WHERE the user is authenticated (location context).
 *                Required for LBAC: permission checks are resolved against
 *                the (user, location) pair, not the user alone.
 *                Switching locations requires creating a new session.
 *                onDelete: 'restrict' — retiring a location must clear its
 *                sessions first (service layer responsibility).
 *
 * `revokedAt`  — explicit invalidation (password change, forced logout,
 *                role change). Null = not revoked. The auth layer must
 *                treat revokedAt IS NOT NULL as equivalent to expired.
 *                Retains the row for audit purposes.
 *
 * `ipAddress`  — captured at session creation. Used for anomaly detection
 *                and user-facing "active sessions" display.
 *
 * `userAgent`  — raw UA string at session creation. Limited to 512 chars
 *                to prevent unbounded storage from malformed clients.
 *
 * `expiredAt`  — absolute expiry timestamp. Set at creation (createdAt + TTL).
 *                Background job should delete expired sessions periodically.
 */
export const sessionsTable = pgTable(
	'sessions',
	{
		...pk,
		userId: integer('user_id')
			.notNull()
			.references(() => usersTable.id, { onDelete: 'cascade' }),

		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),

		ipAddress: text('ip_address'),
		userAgent: varchar('user_agent', { length: 512 }),

		revokedAt: timestamp('revoked_at', { mode: 'date', withTimezone: true }),
		createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
		expiredAt: timestamp('expired_at', { mode: 'date', withTimezone: true }).notNull(),
	},
	(t) => [
		// Cleanup job: sweep all expired sessions
		index('sessions_expired_at_idx').on(t.expiredAt),

		// User queries: get all sessions for user (active sessions page)
		index('sessions_user_revoked_idx').on(t.userId, t.revokedAt),

		// Location queries: find sessions at location (for location-specific operations)
		index('sessions_location_idx').on(t.locationId),
	],
)
