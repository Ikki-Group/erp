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

import { integrationProviderEnum, mokaScrapStatusEnum, mokaScrapTypeEnum, mokaSyncTriggerModeEnum } from './_enums'
import { auditBasicColumns, pk } from './_helpers'
import { locationsTable } from './location'

// ─── Tables ───────────────────────────────────────────────────────────────────

export const mokaConfigurationsTable = pgTable(
	'moka_configurations',
	{
		...pk,
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'cascade' }),
		provider: integrationProviderEnum('provider').notNull().default('moka'),
		email: text('email').notNull(),
		password: text('password').notNull(),
		businessId: text('business_id'),
		outletId: text('outlet_id'),
		accessToken: text('access_token'),
		isActive: boolean('is_active').notNull().default(true),
		salesCronEnabled: boolean('sales_cron_enabled').notNull().default(false),
		salesCronExpression: text('sales_cron_expression'),
		lastSyncedAt: timestamp('last_synced_at', { mode: 'date', withTimezone: true }),
		lastSalesSyncedAt: timestamp('last_sales_synced_at', { mode: 'date', withTimezone: true }),
		lastProductSyncedAt: timestamp('last_product_synced_at', { mode: 'date', withTimezone: true }),
		lastCategorySyncedAt: timestamp('last_category_synced_at', { mode: 'date', withTimezone: true }),
		...auditBasicColumns,
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
		mokaConfigurationId: integer('moka_configuration_id')
			.notNull()
			.references(() => mokaConfigurationsTable.id, { onDelete: 'cascade' }),
		provider: integrationProviderEnum('provider').notNull().default('moka'),
		type: mokaScrapTypeEnum('type').notNull(),
		triggerMode: mokaSyncTriggerModeEnum('trigger_mode').notNull().default('manual'),
		status: mokaScrapStatusEnum('status').notNull().default('pending'),
		dateFrom: timestamp('date_from', { mode: 'date', withTimezone: true }).notNull(),
		dateTo: timestamp('date_to', { mode: 'date', withTimezone: true }).notNull(),
		startedAt: timestamp('started_at', { mode: 'date', withTimezone: true }),
		finishedAt: timestamp('finished_at', { mode: 'date', withTimezone: true }),
		recordsCount: integer('records_count').notNull().default(0),
		rawPath: text('raw_path'),
		errorMessage: text('error_message'),
		metadata: jsonb('metadata'),
		...auditBasicColumns,
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
		mokaConfigurationId: integer('moka_configuration_id')
			.notNull()
			.references(() => mokaConfigurationsTable.id, { onDelete: 'cascade' }),
		type: mokaScrapTypeEnum('type').notNull(),
		provider: integrationProviderEnum('provider').notNull().default('moka'),
		cursorDate: timestamp('cursor_date', { mode: 'date', withTimezone: true }),
		cursorToken: text('cursor_token'),
		lastHistoryId: integer('last_history_id').references(() => mokaScrapHistoriesTable.id, {
			onDelete: 'set null',
		}),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('moka_sync_cursor_config_type_idx').on(t.mokaConfigurationId, t.type),
		index('moka_sync_cursor_history_idx').on(t.lastHistoryId),
	],
)
