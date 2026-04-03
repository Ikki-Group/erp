import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'
import { locationsTable } from './location'
import { recipesTable } from './recipe'

export const workOrderStatusEnum = pgEnum('work_order_status', [
  'draft',
  'in_progress',
  'completed',
  'cancelled',
])

export const workOrdersTable = pgTable(
  'work_orders',
  {
    ...pk,
    recipeId: integer()
      .notNull()
      .references(() => recipesTable.id),
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id),
    
    status: workOrderStatusEnum().notNull().default('draft'),
    
    // Quantity we expect to produce
    expectedQty: numeric({ precision: 18, scale: 4 }).notNull(),
    // Quantity actually produced (recorded on completion)
    actualQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    
    note: text(),
    
    // Total cost of all materials used (valued at completion time)
    totalCost: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    
    startedAt: timestamp(),
    completedAt: timestamp(),
    
    ...auditColumns,
  }
)

export type WorkOrder = typeof workOrdersTable.$inferSelect
export type NewWorkOrder = typeof workOrdersTable.$inferInsert
