import { pgTable, varchar, numeric, integer, index, uniqueIndex } from 'drizzle-orm/pg-core'

import { pk, auditBasicColumns } from './_helpers.ts'
import { materials } from './material.ts'
import { uoms } from './uom.ts'

// ─── Suppliers ───

export const suppliers = pgTable(
	'suppliers',
	{
		...pk,
		code: varchar('code', { length: 50 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		contactPerson: varchar('contact_person', { length: 255 }),
		phone: varchar('phone', { length: 50 }),
		email: varchar('email', { length: 255 }),
		address: varchar('address', { length: 500 }),
		paymentTerms: integer('payment_terms'),
		isActive: integer('is_active').notNull().default(1),
		...auditBasicColumns,
	},
	(t) => [uniqueIndex('suppliers_code_uniq').on(t.code)],
)

// ─── Supplier Materials ───

export const supplierMaterials = pgTable(
	'supplier_materials',
	{
		...pk,
		supplierId: integer('supplier_id')
			.notNull()
			.references(() => suppliers.id, { onDelete: 'cascade' }),
		materialId: integer('material_id')
			.notNull()
			.references(() => materials.id, { onDelete: 'restrict' }),
		unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull(),
		uomId: integer('uom_id')
			.notNull()
			.references(() => uoms.id, { onDelete: 'restrict' }),
		minOrderQty: numeric('min_order_qty', { precision: 18, scale: 6 }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('supplier_materials_supplier_material_uniq').on(t.supplierId, t.materialId),
		index('supplier_materials_supplier_id_idx').on(t.supplierId),
		index('supplier_materials_material_id_idx').on(t.materialId),
		index('supplier_materials_uom_id_idx').on(t.uomId),
	],
)
