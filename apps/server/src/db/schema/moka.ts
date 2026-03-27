import { integer, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { metadata, pk } from './_helpers'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const mokaScrapTypeEnum = pgEnum('moka_scrap_type', ['sales', 'product', 'category'])
export const mokaScrapStatusEnum = pgEnum('moka_scrap_status', ['pending', 'processing', 'completed', 'failed'])

// ─── Tables ───────────────────────────────────────────────────────────────────

export const mokaConfigurationsTable = pgTable('moka_configurations', {
  ...pk,
  locationId: integer().notNull(),
  email: text().notNull(),
  password: text().notNull(),
  businessId: integer(),
  outletId: integer(),
  accessToken: text(),
  lastSyncedAt: timestamp({ mode: 'date', withTimezone: true }),
  ...metadata,
})

export const mokaScrapHistoriesTable = pgTable('moka_scrap_histories', {
  ...pk,
  mokaConfigurationId: integer().notNull(),
  type: mokaScrapTypeEnum().notNull(),
  status: mokaScrapStatusEnum().notNull().default('pending'),
  dateFrom: timestamp({ mode: 'date', withTimezone: true }).notNull(),
  dateTo: timestamp({ mode: 'date', withTimezone: true }).notNull(),
  rawPath: text(), // S3/R2 path
  errorMessage: text(),
  metadata: jsonb(),
  ...metadata,
})
