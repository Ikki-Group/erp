import { sql } from 'drizzle-orm'
import {
	pgTable,
	pgEnum,
	varchar,
	numeric,
	integer,
	timestamp,
	check,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { pk, auditBasicColumns } from './_helpers.ts'
import { locations } from './core.ts'
import { users } from './iam.ts'
import { materials } from './material.ts'
import { suppliers } from './supplier.ts'
import { uoms } from './uom.ts'

// ─── Enums ───

export const movementDirectionEnum = pgEnum('movement_direction', ['in', 'out'])
export const transferStatusEnum = pgEnum('transfer_status', [
	'requested',
	'in_transit',
	'received',
	'cancelled',
])
export const opnameStatusEnum = pgEnum('opname_status', [
	'draft',
	'in_progress',
	'completed',
	'cancelled',
])
export const receivingStatusEnum = pgEnum('receiving_status', ['draft', 'confirmed'])

// ─── Stock Balances ───

export const stockBalances = pgTable(
	'stock_balances',
	{
		...pk,
		materialId: integer('material_id')
			.notNull()
			.references(() => materials.id, { onDelete: 'restrict' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'restrict' }),
		quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull().default('0'),
		costPrice: numeric('cost_price', { precision: 18, scale: 6 }).notNull().default('0'),
	},
	(t) => [
		uniqueIndex('stock_balances_material_location_uniq').on(t.materialId, t.locationId),
		check('stock_balances_qty_nonneg_chk', sql`${t.quantity} >= 0`),
		index('stock_balances_material_id_idx').on(t.materialId),
		index('stock_balances_location_id_idx').on(t.locationId),
	],
)

// ─── Stock Movements ───

export const stockMovements = pgTable(
	'stock_movements',
	{
		...pk,
		materialId: integer('material_id')
			.notNull()
			.references(() => materials.id, { onDelete: 'restrict' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'restrict' }),
		type: varchar('type', { length: 50 }).notNull(),
		direction: movementDirectionEnum('direction').notNull(),
		quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull(),
		costPrice: numeric('cost_price', { precision: 18, scale: 6 }).notNull(),
		referenceType: varchar('reference_type', { length: 50 }),
		referenceId: integer('reference_id'),
		notes: varchar('notes', { length: 1000 }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
	},
	(t) => [
		index('stock_movements_material_location_created_idx').on(
			t.materialId,
			t.locationId,
			t.createdAt,
		),
		index('stock_movements_material_id_idx').on(t.materialId),
		index('stock_movements_location_id_idx').on(t.locationId),
		index('stock_movements_created_by_idx').on(t.createdBy),
	],
)

// ─── Transfer Requests ───

export const transferRequests = pgTable(
	'transfer_requests',
	{
		...pk,
		transferNo: varchar('transfer_no', { length: 100 }).notNull(),
		fromLocationId: integer('from_location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'restrict' }),
		toLocationId: integer('to_location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'restrict' }),
		status: transferStatusEnum('status').notNull().default('requested'),
		notes: varchar('notes', { length: 1000 }),
		requestedBy: integer('requested_by').references(() => users.id, { onDelete: 'set null' }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('transfer_requests_transfer_no_uniq').on(t.transferNo),
		check('transfer_requests_diff_location_chk', sql`${t.fromLocationId} != ${t.toLocationId}`),
		index('transfer_requests_from_location_id_idx').on(t.fromLocationId),
		index('transfer_requests_to_location_id_idx').on(t.toLocationId),
		index('transfer_requests_requested_by_idx').on(t.requestedBy),
	],
)

// ─── Transfer Lines ───

export const transferLines = pgTable(
	'transfer_lines',
	{
		...pk,
		transferId: integer('transfer_id')
			.notNull()
			.references(() => transferRequests.id, { onDelete: 'cascade' }),
		materialId: integer('material_id')
			.notNull()
			.references(() => materials.id, { onDelete: 'restrict' }),
		requestedQty: numeric('requested_qty', { precision: 18, scale: 6 }).notNull(),
		shippedQty: numeric('shipped_qty', { precision: 18, scale: 6 }),
		receivedQty: numeric('received_qty', { precision: 18, scale: 6 }),
		uomId: integer('uom_id')
			.notNull()
			.references(() => uoms.id, { onDelete: 'restrict' }),
	},
	(t) => [
		index('transfer_lines_transfer_id_idx').on(t.transferId),
		index('transfer_lines_material_id_idx').on(t.materialId),
		index('transfer_lines_uom_id_idx').on(t.uomId),
	],
)

// ─── Stock Opnames ───

export const stockOpnames = pgTable(
	'stock_opnames',
	{
		...pk,
		opnameNo: varchar('opname_no', { length: 100 }).notNull(),
		locationId: integer('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'restrict' }),
		status: opnameStatusEnum('status').notNull().default('draft'),
		startedAt: timestamp('started_at', { withTimezone: true }),
		completedAt: timestamp('completed_at', { withTimezone: true }),
		conductedBy: integer('conducted_by').references(() => users.id, { onDelete: 'set null' }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('stock_opnames_opname_no_uniq').on(t.opnameNo),
		index('stock_opnames_location_id_idx').on(t.locationId),
		index('stock_opnames_conducted_by_idx').on(t.conductedBy),
	],
)

// ─── Stock Opname Lines ───

export const stockOpnameLines = pgTable(
	'stock_opname_lines',
	{
		...pk,
		opnameId: integer('opname_id')
			.notNull()
			.references(() => stockOpnames.id, { onDelete: 'cascade' }),
		materialId: integer('material_id')
			.notNull()
			.references(() => materials.id, { onDelete: 'restrict' }),
		systemQty: numeric('system_qty', { precision: 18, scale: 6 }).notNull(),
		actualQty: numeric('actual_qty', { precision: 18, scale: 6 }).notNull(),
		reason: varchar('reason', { length: 500 }),
	},
	(t) => [
		index('stock_opname_lines_opname_id_idx').on(t.opnameId),
		index('stock_opname_lines_material_id_idx').on(t.materialId),
	],
)

// ─── Receivings ───

export const receivings = pgTable(
	'receivings',
	{
		...pk,
		receivingNo: varchar('receiving_no', { length: 100 }).notNull(),
		locationId: integer('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'restrict' }),
		supplierId: integer('supplier_id')
			.notNull()
			.references(() => suppliers.id, { onDelete: 'restrict' }),
		status: receivingStatusEnum('status').notNull().default('draft'),
		notes: varchar('notes', { length: 1000 }),
		receivedBy: integer('received_by').references(() => users.id, { onDelete: 'set null' }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('receivings_receiving_no_uniq').on(t.receivingNo),
		index('receivings_location_id_idx').on(t.locationId),
		index('receivings_supplier_id_idx').on(t.supplierId),
		index('receivings_received_by_idx').on(t.receivedBy),
	],
)

// ─── Receiving Lines ───

export const receivingLines = pgTable(
	'receiving_lines',
	{
		...pk,
		receivingId: integer('receiving_id')
			.notNull()
			.references(() => receivings.id, { onDelete: 'cascade' }),
		materialId: integer('material_id')
			.notNull()
			.references(() => materials.id, { onDelete: 'restrict' }),
		quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull(),
		unitCost: numeric('unit_cost', { precision: 18, scale: 6 }).notNull(),
		uomId: integer('uom_id')
			.notNull()
			.references(() => uoms.id, { onDelete: 'restrict' }),
	},
	(t) => [
		index('receiving_lines_receiving_id_idx').on(t.receivingId),
		index('receiving_lines_material_id_idx').on(t.materialId),
		index('receiving_lines_uom_id_idx').on(t.uomId),
	],
)
