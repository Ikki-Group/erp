import { pgEnum } from 'drizzle-orm/pg-core'

/**
 * Centralized Enum Definitions
 *
 * All PostgreSQL enum types used across schema tables.
 * Extracted from migration SQL to maintain single source of truth.
 */

// ─── Finance Enums ────────────────────────────────────────────────────────────

export const accountTypeEnum = pgEnum('account_type', ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])

export const expenditureStatusEnum = pgEnum('expenditure_status', ['PENDING', 'PAID', 'VOID', 'REFUNDED'])

export const expenditureTypeEnum = pgEnum('expenditure_type', ['BILLS', 'ASSET', 'PURCHASES'])

export const paymentTypeEnum = pgEnum('payment_type', ['payable', 'receivable'])

export const paymentMethodEnum = pgEnum('payment_method', [
	'cash',
	'bank_transfer',
	'credit_card',
	'debit_card',
	'e_wallet',
])

export const paymentMethodCategoryEnum = pgEnum('payment_method_category', ['cash', 'cashless'])

export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'open', 'paid', 'void'])

// ─── Inventory Enums ──────────────────────────────────────────────────────────

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

export const stockAdjustmentTypeEnum = pgEnum('stock_adjustment_type', [
	'opname',
	'found',
	'waste',
	'correction',
])

// ─── Sales Enums ──────────────────────────────────────────────────────────────

export const salesOrderStatusEnum = pgEnum('sales_order_status', ['open', 'closed', 'void'])

export const salesOrderSourceEnum = pgEnum('sales_order_source', ['web', 'moka', 'upload', 'machine_fetch'])

// ─── Purchasing Enums ─────────────────────────────────────────────────────────

export const purchaseRequestStatusEnum = pgEnum('purchase_request_status', [
	'open',
	'approved',
	'rejected',
	'void',
])

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
	'pending_approval',
	'approved',
	'rejected',
	'open',
	'closed',
	'void',
])

export const goodsReceiptStatusEnum = pgEnum('goods_receipt_status', ['open', 'completed', 'void'])

// ─── Production Enums ─────────────────────────────────────────────────────────

export const workOrderStatusEnum = pgEnum('work_order_status', ['draft', 'in_progress', 'completed', 'cancelled'])

// ─── Product Enums ────────────────────────────────────────────────────────────

export const productStatusEnum = pgEnum('product_status', ['active', 'inactive', 'archived'])

// ─── HR Enums ─────────────────────────────────────────────────────────────────

export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'on_leave'])

export const leaveTypeEnum = pgEnum('leave_type', ['annual', 'sick', 'unpaid', 'other'])

export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected', 'cancelled'])

export const payrollStatusEnum = pgEnum('payroll_status', ['draft', 'approved', 'paid', 'cancelled'])

export const payrollAdjustmentTypeEnum = pgEnum('payroll_adjustment_type', ['addition', 'deduction'])

// ─── Integration Enums ────────────────────────────────────────────────────────

export const integrationProviderEnum = pgEnum('integration_provider', ['moka'])

export const mokaScrapTypeEnum = pgEnum('moka_scrap_type', ['sales', 'product', 'category'])

export const mokaScrapStatusEnum = pgEnum('moka_scrap_status', ['pending', 'processing', 'completed', 'failed'])

export const mokaSyncTriggerModeEnum = pgEnum('moka_sync_trigger_mode', [
	'manual',
	'cron',
	'upload',
	'machine_fetch',
])
