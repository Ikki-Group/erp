import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { mokaScrapStatusEnum, mokaScrapTypeEnum } from './_helpers'

// ─── Tables ───────────────────────────────────────────────────────────────────

export const mokaConfigurationsTable = pgTable('moka_configurations', {
	...pk,
	// Soft-link to Location ID
	locationId: integer().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	// Moka business IDs might be large or alphanumeric, change from int to text
	businessId: text(),
	// Moka outlet IDs
	outletId: text(),
	accessToken: text(),
	lastSyncedAt: timestamp({ mode: 'date', withTimezone: true }),
	...auditColumns,
})

export const mokaScrapHistoriesTable = pgTable('moka_scrap_histories', {
	...pk,
	// Soft-link or strict reference to moka_configurations
	mokaConfigurationId: integer().notNull(),
	type: mokaScrapTypeEnum().notNull(),
	status: mokaScrapStatusEnum().notNull().default('pending'),
	dateFrom: timestamp({ mode: 'date', withTimezone: true }).notNull(),
	dateTo: timestamp({ mode: 'date', withTimezone: true }).notNull(),
	// S3/R2 path
	rawPath: text(),
	errorMessage: text(),
	metadata: jsonb(),
	...auditColumns,
})
