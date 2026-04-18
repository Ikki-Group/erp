import { pgEnum } from 'drizzle-orm/pg-core'

// ─── Shared Enums ─────────────────────────────────────────────────────────────

export const locationTypeEnum = pgEnum('location_type', ['store', 'warehouse'])

// Enforced strictly: raw (e.g. Beans), semi (e.g. Pre-made sauces), packaging (e.g. Cups)
export const materialTypeEnum = pgEnum('material_type', ['raw', 'semi', 'packaging'])

export const transactionTypeEnum = pgEnum('transaction_type', [
	'purchase',
	'transfer_in',
	'transfer_out',
	'adjustment',
	'sell',
	'usage',
	'production_in',
	'production_out',
])

export const productStatusEnum = pgEnum('product_status', ['active', 'inactive', 'archived'])

// ─── New Enums for Enhancements ─────────────────────────────────────────────

export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'open', 'paid', 'void'])

export const paymentTypeEnum = pgEnum('payment_type', ['payable', 'receivable'])

export const paymentMethodEnum = pgEnum('payment_method', [
	'cash',
	'bank_transfer',
	'credit_card',
	'debit_card',
	'e_wallet',
])

export const stockAdjustmentTypeEnum = pgEnum('stock_adjustment_type', [
	'opname',
	'found',
	'waste',
	'correction',
])

export const leaveTypeEnum = pgEnum('leave_type', ['annual', 'sick', 'unpaid', 'other'])

export const leaveStatusEnum = pgEnum('leave_status', [
	'pending',
	'approved',
	'rejected',
	'cancelled',
])
