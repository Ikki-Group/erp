import { check, index, integer, numeric, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { auditFullColumns, pk } from './_helpers'
import { locationsTable } from './location'
import { recipesTable } from './recipe'

export const workOrderStatusEnum = pgEnum('work_order_status', ['draft', 'in_progress', 'completed', 'cancelled'])

export const workOrdersTable = pgTable(
	'work_orders',
	{
		...pk,
		recipeId: integer('recipe_id')
			.notNull()
			.references(() => recipesTable.id, { onDelete: 'restrict' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),

		status: workOrderStatusEnum('status').notNull().default('draft'),

		// Quantity we expect to produce
		expectedQty: numeric('expected_qty', { precision: 18, scale: 6 }).notNull(),
		// Quantity actually produced (recorded on completion)
		actualQty: numeric('actual_qty', { precision: 18, scale: 6 }).notNull().default('0'),

		note: text('note'),

		// Total cost of all materials used (valued at completion time)
		totalCost: numeric('total_cost', { precision: 18, scale: 2 }).notNull().default('0'),

		startedAt: timestamp('started_at', { mode: 'date', withTimezone: true }),
		completedAt: timestamp('completed_at', { mode: 'date', withTimezone: true }),

		...auditFullColumns,
	},
	(t) => [
		index('work_orders_recipe_idx').on(t.recipeId),
		index('work_orders_location_idx').on(t.locationId),
		index('work_orders_status_idx').on(t.status),

		// Quantities must be positive
		check('work_orders_expected_qty_pos_chk', sql`expected_qty > 0`),
		check('work_orders_actual_qty_nonneg_chk', sql`actual_qty >= 0`),
		// Total cost must be non-negative
		check('work_orders_total_cost_nonneg_chk', sql`total_cost >= 0`),
	],
)

export type WorkOrder = typeof workOrdersTable.$inferSelect
export type NewWorkOrder = typeof workOrdersTable.$inferInsert
