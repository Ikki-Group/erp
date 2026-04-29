import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import {
	integrationProviderEnum,
	mokaScrapStatusEnum,
	mokaScrapTypeEnum,
	mokaSyncTriggerModeEnum,
} from './_helpers'
import { locationsTable } from './location'

// ─── Tables ───────────────────────────────────────────────────────────────────

export const mokaConfigurationsTable = pgTable(
	'moka_configurations',
	{
		...pk,
		locationId: integer()
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'cascade' }),
		provider: integrationProviderEnum().notNull().default('moka'),
		email: text().notNull(),
		password: text().notNull(),
		businessId: text(),
		outletId: text(),
		accessToken: text(),
		isActive: boolean().notNull().default(true),
		salesCronEnabled: boolean().notNull().default(false),
		salesCronExpression: text(),
		lastSyncedAt: timestamp({ mode: 'date', withTimezone: true }),
		lastSalesSyncedAt: timestamp({ mode: 'date', withTimezone: true }),
		lastProductSyncedAt: timestamp({ mode: 'date', withTimezone: true }),
		lastCategorySyncedAt: timestamp({ mode: 'date', withTimezone: true }),
		...auditColumns,
	},
	(t) => [
		uniqueIndex('moka_config_provider_location_idx').on(t.provider, t.locationId),
		index('moka_config_location_idx').on(t.locationId),
		index('moka_config_provider_idx').on(t.provider),
		index('moka_config_active_idx').on(t.isActive),
	],
)

export const mokaScrapHistoriesTable = pgTable(
	'moka_scrap_histories',
	{
		...pk,
		mokaConfigurationId: integer()
			.notNull()
			.references(() => mokaConfigurationsTable.id, { onDelete: 'cascade' }),
		provider: integrationProviderEnum().notNull().default('moka'),
		type: mokaScrapTypeEnum().notNull(),
		triggerMode: mokaSyncTriggerModeEnum().notNull().default('manual'),
		status: mokaScrapStatusEnum().notNull().default('pending'),
		dateFrom: timestamp({ mode: 'date', withTimezone: true }).notNull(),
		dateTo: timestamp({ mode: 'date', withTimezone: true }).notNull(),
		startedAt: timestamp({ mode: 'date', withTimezone: true }),
		finishedAt: timestamp({ mode: 'date', withTimezone: true }),
		recordsCount: integer().notNull().default(0),
		rawPath: text(),
		errorMessage: text(),
		metadata: jsonb(),
		...auditColumns,
	},
	(t) => [
		index('moka_scrap_history_config_idx').on(t.mokaConfigurationId),
		index('moka_scrap_history_provider_idx').on(t.provider),
		index('moka_scrap_history_type_idx').on(t.type),
		index('moka_scrap_history_status_idx').on(t.status),
		index('moka_scrap_history_trigger_mode_idx').on(t.triggerMode),
		index('moka_scrap_history_created_at_idx').on(t.createdAt),
	],
)

export const mokaSyncCursorsTable = pgTable(
	'moka_sync_cursors',
	{
		...pk,
		mokaConfigurationId: integer()
			.notNull()
			.references(() => mokaConfigurationsTable.id, { onDelete: 'cascade' }),
		type: mokaScrapTypeEnum().notNull(),
		provider: integrationProviderEnum().notNull().default('moka'),
		cursorDate: timestamp({ mode: 'date', withTimezone: true }),
		cursorToken: text(),
		lastHistoryId: integer().references(() => mokaScrapHistoriesTable.id, { onDelete: 'set null' }),
		...auditColumns,
	},
	(t) => [
		uniqueIndex('moka_sync_cursor_config_type_idx').on(t.mokaConfigurationId, t.type),
		index('moka_sync_cursor_history_idx').on(t.lastHistoryId),
	],
)
