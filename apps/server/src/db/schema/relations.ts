// oxlint-disable import/max-dependencies
// oxlint-disable max-lines
import { defineRelations } from 'drizzle-orm'

import { customersTable } from './customer'
import { employeesTable } from './employee'
import { accountsTable, expendituresTable, journalEntriesTable, journalItemsTable } from './finance'
import { paymentsTable, paymentInvoicesTable } from './finance_payment'
import {
	attendancesTable,
	leaveRequestsTable,
	payrollAdjustmentsTable,
	payrollBatchesTable,
	payrollItemsTable,
	shiftsTable,
} from './hr'
import { rolesTable, sessionsTable, userAssignmentsTable, usersTable } from './iam'
import {
	stockAdjustmentItemsTable,
	stockAdjustmentsTable,
	stockBatchesTable,
	stockSummariesTable,
	stockTransactionsTable,
} from './inventory'
import { locationsTable } from './location'
import {
	materialCategoriesTable,
	materialConversionsTable,
	materialLocationsTable,
	materialsTable,
	uomsTable,
} from './material'
import { mokaConfigurationsTable, mokaScrapHistoriesTable, mokaSyncCursorsTable } from './moka'
import {
	categoryExternalMappingsTable,
	productCategoriesTable,
	productExternalMappingsTable,
	productPricesTable,
	productsTable,
	productVariantsTable,
	salesTypesTable,
	variantPricesTable,
} from './product'
import { workOrdersTable } from './production'
import {
	goodsReceiptNoteItemsTable,
	goodsReceiptNotesTable,
	purchaseInvoiceItemsTable,
	purchaseInvoicesTable,
	purchaseOrderItemsTable,
	purchaseOrdersTable,
	purchaseRequestItemsTable,
	purchaseRequestsTable,
} from './purchasing'
import { recipeItemsTable, recipesTable } from './recipe'
import {
	salesExternalRefsTable,
	salesInvoiceItemsTable,
	salesInvoicesTable,
	salesOrderBatchesTable,
	salesOrderItemsTable,
	salesOrdersTable,
	salesVoidsTable,
} from './sales'
import { suppliersTable } from './supplier'
import { taxesTable } from './tax'

export const relations = defineRelations(
	{
		usersTable,
		rolesTable,
		userAssignmentsTable,
		sessionsTable,
		locationsTable,
		uomsTable,
		materialCategoriesTable,
		materialsTable,
		materialConversionsTable,
		materialLocationsTable,
		stockTransactionsTable,
		stockSummariesTable,
		stockBatchesTable,
		stockAdjustmentsTable,
		stockAdjustmentItemsTable,
		salesTypesTable,
		productCategoriesTable,
		productsTable,
		productPricesTable,
		productVariantsTable,
		variantPricesTable,
		productExternalMappingsTable,
		categoryExternalMappingsTable,
		recipesTable,
		recipeItemsTable,
		mokaConfigurationsTable,
		mokaScrapHistoriesTable,
		mokaSyncCursorsTable,
		salesOrdersTable,
		salesOrderBatchesTable,
		salesOrderItemsTable,
		salesInvoicesTable,
		salesInvoiceItemsTable,
		salesVoidsTable,
		salesExternalRefsTable,
		suppliersTable,
		customersTable,
		employeesTable,
		accountsTable,
		journalEntriesTable,
		journalItemsTable,
		purchaseRequestsTable,
		purchaseRequestItemsTable,
		purchaseOrdersTable,
		purchaseOrderItemsTable,
		purchaseInvoicesTable,
		purchaseInvoiceItemsTable,
		goodsReceiptNoteItemsTable,
		goodsReceiptNotesTable,
		workOrdersTable,
		attendancesTable,
		shiftsTable,
		payrollBatchesTable,
		payrollItemsTable,
		payrollAdjustmentsTable,
		leaveRequestsTable,
		expendituresTable,
		taxesTable,
		paymentsTable,
		paymentInvoicesTable,
	},
	(r) => ({
		// ─── IAM ──────────────────────────────────────────────────────────

		usersTable: { assignments: r.many.userAssignmentsTable(), sessions: r.many.sessionsTable() },

		rolesTable: { userAssignments: r.many.userAssignmentsTable() },

		userAssignmentsTable: {
			user: r.one.usersTable({ from: r.userAssignmentsTable.userId, to: r.usersTable.id }),
			role: r.one.rolesTable({ from: r.userAssignmentsTable.roleId, to: r.rolesTable.id }),
			location: r.one.locationsTable({
				from: r.userAssignmentsTable.locationId,
				to: r.locationsTable.id,
			}),
		},

		sessionsTable: {
			user: r.one.usersTable({ from: r.sessionsTable.userId, to: r.usersTable.id }),
		},

		// ─── Location ─────────────────────────────────────────────────────

		locationsTable: {
			userAssignments: r.many.userAssignmentsTable(),
			materialLocations: r.many.materialLocationsTable(),
			stockTransactions: r.many.stockTransactionsTable({ alias: 'location' }),
			stockSummaries: r.many.stockSummariesTable(),
			products: r.many.productsTable(),
			mokaConfigurations: r.many.mokaConfigurationsTable(),
			salesOrders: r.many.salesOrdersTable(),
			purchaseRequests: r.many.purchaseRequestsTable(),
			purchaseOrders: r.many.purchaseOrdersTable(),
			purchaseInvoices: r.many.purchaseInvoicesTable(),
			salesInvoices: r.many.salesInvoicesTable(),
			stockAdjustments: r.many.stockAdjustmentsTable(),
		},

		// ─── Taxation ─────────────────────────────────────────────────────

		taxesTable: {
			account: r.one.accountsTable({ from: r.taxesTable.accountId, to: r.accountsTable.id }),
			materials: r.many.materialsTable(),
			products: r.many.productsTable(),
		},

		// ─── CRM ──────────────────────────────────────────────────────────

		customersTable: {
			salesOrders: r.many.salesOrdersTable(),
			salesInvoices: r.many.salesInvoicesTable(),
		},

		// ─── Material ─────────────────────────────────────────────────────

		materialCategoriesTable: { materials: r.many.materialsTable() },

		materialsTable: {
			category: r.one.materialCategoriesTable({
				from: r.materialsTable.categoryId,
				to: r.materialCategoriesTable.id,
			}),
			tax: r.one.taxesTable({ from: r.materialsTable.taxId, to: r.taxesTable.id }),
			conversions: r.many.materialConversionsTable(),
			materialLocations: r.many.materialLocationsTable(),
			stockTransactions: r.many.stockTransactionsTable(),
			stockSummaries: r.many.stockSummariesTable(),
			stockBatches: r.many.stockBatchesTable(),
			recipe: r.many.recipesTable(),
			recipeItems: r.many.recipeItemsTable(),
			purchaseOrderItems: r.many.purchaseOrderItemsTable(),
		},

		materialConversionsTable: {
			material: r.one.materialsTable({
				from: r.materialConversionsTable.materialId,
				to: r.materialsTable.id,
			}),
		},

		materialLocationsTable: {
			material: r.one.materialsTable({
				from: r.materialLocationsTable.materialId,
				to: r.materialsTable.id,
			}),
			location: r.one.locationsTable({
				from: r.materialLocationsTable.locationId,
				to: r.locationsTable.id,
			}),
		},

		// ─── Inventory ────────────────────────────────────────────────────

		stockTransactionsTable: {
			material: r.one.materialsTable({
				from: r.stockTransactionsTable.materialId,
				to: r.materialsTable.id,
			}),
			location: r.one.locationsTable({
				from: r.stockTransactionsTable.locationId,
				to: r.locationsTable.id,
				alias: 'location',
			}),
			counterpartLocation: r.one.locationsTable({
				from: r.stockTransactionsTable.counterpartLocationId,
				to: r.locationsTable.id,
				alias: 'counterpartLocation',
			}),
			batch: r.one.stockBatchesTable({
				from: r.stockTransactionsTable.batchId,
				to: r.stockBatchesTable.id,
			}),
			adjustmentItem: r.one.stockAdjustmentItemsTable({
				from: r.stockTransactionsTable.adjustmentItemId,
				to: r.stockAdjustmentItemsTable.id,
			}),
		},

		stockSummariesTable: {
			material: r.one.materialsTable({
				from: r.stockSummariesTable.materialId,
				to: r.materialsTable.id,
			}),
			location: r.one.locationsTable({
				from: r.stockSummariesTable.locationId,
				to: r.locationsTable.id,
			}),
		},

		stockBatchesTable: {
			material: r.one.materialsTable({
				from: r.stockBatchesTable.materialId,
				to: r.materialsTable.id,
			}),
			transactions: r.many.stockTransactionsTable(),
		},

		stockAdjustmentsTable: {
			location: r.one.locationsTable({
				from: r.stockAdjustmentsTable.locationId,
				to: r.locationsTable.id,
			}),
			items: r.many.stockAdjustmentItemsTable(),
		},

		stockAdjustmentItemsTable: {
			header: r.one.stockAdjustmentsTable({
				from: r.stockAdjustmentItemsTable.adjustmentId,
				to: r.stockAdjustmentsTable.id,
			}),
			material: r.one.materialsTable({
				from: r.stockAdjustmentItemsTable.materialId,
				to: r.materialsTable.id,
			}),
			batch: r.one.stockBatchesTable({
				from: r.stockAdjustmentItemsTable.batchId,
				to: r.stockBatchesTable.id,
			}),
		},

		// ─── Product ──────────────────────────────────────────────────────

		salesTypesTable: {
			variantPrices: r.many.variantPricesTable(),
			productPrices: r.many.productPricesTable(),
			salesOrders: r.many.salesOrdersTable(),
		},

		productCategoriesTable: {
			products: r.many.productsTable(),
			externalMappings: r.many.categoryExternalMappingsTable(),
		},

		productsTable: {
			location: r.one.locationsTable({ from: r.productsTable.locationId, to: r.locationsTable.id }),
			category: r.one.productCategoriesTable({
				from: r.productsTable.categoryId,
				to: r.productCategoriesTable.id,
			}),
			tax: r.one.taxesTable({ from: r.productsTable.taxId, to: r.taxesTable.id }),
			variants: r.many.productVariantsTable(),
			prices: r.many.productPricesTable(),
			externalMappings: r.many.productExternalMappingsTable(),
			recipe: r.many.recipesTable(),
			salesOrderItems: r.many.salesOrderItemsTable(),
		},

		productPricesTable: {
			product: r.one.productsTable({
				from: r.productPricesTable.productId,
				to: r.productsTable.id,
			}),
			salesType: r.one.salesTypesTable({
				from: r.productPricesTable.salesTypeId,
				to: r.salesTypesTable.id,
			}),
		},

		productVariantsTable: {
			product: r.one.productsTable({
				from: r.productVariantsTable.productId,
				to: r.productsTable.id,
			}),
			prices: r.many.variantPricesTable(),
			recipe: r.many.recipesTable(),
			externalMappings: r.many.productExternalMappingsTable(),
			salesOrderItems: r.many.salesOrderItemsTable(),
		},

		variantPricesTable: {
			variant: r.one.productVariantsTable({
				from: r.variantPricesTable.variantId,
				to: r.productVariantsTable.id,
			}),
			salesType: r.one.salesTypesTable({
				from: r.variantPricesTable.salesTypeId,
				to: r.salesTypesTable.id,
			}),
		},

		productExternalMappingsTable: {
			product: r.one.productsTable({
				from: r.productExternalMappingsTable.productId,
				to: r.productsTable.id,
			}),
			variant: r.one.productVariantsTable({
				from: r.productExternalMappingsTable.variantId,
				to: r.productVariantsTable.id,
			}),
		},

		categoryExternalMappingsTable: {
			category: r.one.productCategoriesTable({
				from: r.categoryExternalMappingsTable.categoryId,
				to: r.productCategoriesTable.id,
			}),
		},

		// ─── Recipe ───────────────────────────────────────────────────────

		recipesTable: {
			material: r.one.materialsTable({ from: r.recipesTable.materialId, to: r.materialsTable.id }),
			product: r.one.productsTable({ from: r.recipesTable.productId, to: r.productsTable.id }),
			productVariant: r.one.productVariantsTable({
				from: r.recipesTable.productVariantId,
				to: r.productVariantsTable.id,
			}),
			items: r.many.recipeItemsTable(),
		},

		recipeItemsTable: {
			recipe: r.one.recipesTable({ from: r.recipeItemsTable.recipeId, to: r.recipesTable.id }),
			material: r.one.materialsTable({
				from: r.recipeItemsTable.materialId,
				to: r.materialsTable.id,
			}),
			uom: r.one.uomsTable({ from: r.recipeItemsTable.uomId, to: r.uomsTable.id }),
		},

		// ─── Moka ─────────────────────────────────────────────────────────

		mokaConfigurationsTable: {
			location: r.one.locationsTable({
				from: r.mokaConfigurationsTable.locationId,
				to: r.locationsTable.id,
			}),
			scrapHistories: r.many.mokaScrapHistoriesTable(),
			syncCursors: r.many.mokaSyncCursorsTable(),
		},

		mokaScrapHistoriesTable: {
			configuration: r.one.mokaConfigurationsTable({
				from: r.mokaScrapHistoriesTable.mokaConfigurationId,
				to: r.mokaConfigurationsTable.id,
			}),
			lastCursors: r.many.mokaSyncCursorsTable(),
		},

		mokaSyncCursorsTable: {
			configuration: r.one.mokaConfigurationsTable({
				from: r.mokaSyncCursorsTable.mokaConfigurationId,
				to: r.mokaConfigurationsTable.id,
			}),
			lastHistory: r.one.mokaScrapHistoriesTable({
				from: r.mokaSyncCursorsTable.lastHistoryId,
				to: r.mokaScrapHistoriesTable.id,
			}),
		},

		// ─── Sales ────────────────────────────────────────────────────────

		salesOrdersTable: {
			location: r.one.locationsTable({
				from: r.salesOrdersTable.locationId,
				to: r.locationsTable.id,
			}),
			customer: r.one.customersTable({
				from: r.salesOrdersTable.customerId,
				to: r.customersTable.id,
			}),
			salesType: r.one.salesTypesTable({
				from: r.salesOrdersTable.salesTypeId,
				to: r.salesTypesTable.id,
			}),
			batches: r.many.salesOrderBatchesTable(),
			items: r.many.salesOrderItemsTable(),
			invoices: r.many.salesInvoicesTable(),
			voids: r.many.salesVoidsTable(),
			externalRefs: r.many.salesExternalRefsTable(),
		},

		salesOrderBatchesTable: {
			order: r.one.salesOrdersTable({
				from: r.salesOrderBatchesTable.orderId,
				to: r.salesOrdersTable.id,
			}),
			items: r.many.salesOrderItemsTable(),
		},

		salesOrderItemsTable: {
			order: r.one.salesOrdersTable({
				from: r.salesOrderItemsTable.orderId,
				to: r.salesOrdersTable.id,
			}),
			batch: r.one.salesOrderBatchesTable({
				from: r.salesOrderItemsTable.batchId,
				to: r.salesOrderBatchesTable.id,
			}),
			product: r.one.productsTable({
				from: r.salesOrderItemsTable.productId,
				to: r.productsTable.id,
			}),
			variant: r.one.productVariantsTable({
				from: r.salesOrderItemsTable.variantId,
				to: r.productVariantsTable.id,
			}),
			invoiceItems: r.many.salesInvoiceItemsTable(),
		},

		salesInvoicesTable: {
			order: r.one.salesOrdersTable({
				from: r.salesInvoicesTable.orderId,
				to: r.salesOrdersTable.id,
			}),
			customer: r.one.customersTable({
				from: r.salesInvoicesTable.customerId,
				to: r.customersTable.id,
			}),
			location: r.one.locationsTable({
				from: r.salesInvoicesTable.locationId,
				to: r.locationsTable.id,
			}),
			items: r.many.salesInvoiceItemsTable(),
			paymentAllocations: r.many.paymentInvoicesTable(),
		},

		salesInvoiceItemsTable: {
			invoice: r.one.salesInvoicesTable({
				from: r.salesInvoiceItemsTable.invoiceId,
				to: r.salesInvoicesTable.id,
			}),
			orderItem: r.one.salesOrderItemsTable({
				from: r.salesInvoiceItemsTable.salesOrderItemId,
				to: r.salesOrderItemsTable.id,
			}),
		},

		salesVoidsTable: {
			order: r.one.salesOrdersTable({ from: r.salesVoidsTable.orderId, to: r.salesOrdersTable.id }),
			item: r.one.salesOrderItemsTable({
				from: r.salesVoidsTable.itemId,
				to: r.salesOrderItemsTable.id,
			}),
		},

		salesExternalRefsTable: {
			order: r.one.salesOrdersTable({
				from: r.salesExternalRefsTable.orderId,
				to: r.salesOrdersTable.id,
			}),
		},

		// ─── Purchasing ───────────────────────────────────────────────────

		purchaseRequestsTable: {
			location: r.one.locationsTable({
				from: r.purchaseRequestsTable.locationId,
				to: r.locationsTable.id,
			}),
			items: r.many.purchaseRequestItemsTable(),
			purchaseOrders: r.many.purchaseOrdersTable(),
		},

		purchaseRequestItemsTable: {
			request: r.one.purchaseRequestsTable({
				from: r.purchaseRequestItemsTable.requestId,
				to: r.purchaseRequestsTable.id,
			}),
			material: r.one.materialsTable({
				from: r.purchaseRequestItemsTable.materialId,
				to: r.materialsTable.id,
			}),
			purchaseOrderItems: r.many.purchaseOrderItemsTable(),
		},

		purchaseOrdersTable: {
			request: r.one.purchaseRequestsTable({
				from: r.purchaseOrdersTable.requestId,
				to: r.purchaseRequestsTable.id,
			}),
			location: r.one.locationsTable({
				from: r.purchaseOrdersTable.locationId,
				to: r.locationsTable.id,
			}),
			supplier: r.one.suppliersTable({
				from: r.purchaseOrdersTable.supplierId,
				to: r.suppliersTable.id,
			}),
			items: r.many.purchaseOrderItemsTable(),
			receipts: r.many.goodsReceiptNotesTable(),
			invoices: r.many.purchaseInvoicesTable(),
		},

		purchaseOrderItemsTable: {
			order: r.one.purchaseOrdersTable({
				from: r.purchaseOrderItemsTable.orderId,
				to: r.purchaseOrdersTable.id,
			}),
			requestItem: r.one.purchaseRequestItemsTable({
				from: r.purchaseOrderItemsTable.requestItemId,
				to: r.purchaseRequestItemsTable.id,
			}),
			material: r.one.materialsTable({
				from: r.purchaseOrderItemsTable.materialId,
				to: r.materialsTable.id,
			}),
			receiptItems: r.many.goodsReceiptNoteItemsTable(),
			invoiceItems: r.many.purchaseInvoiceItemsTable(),
		},

		goodsReceiptNotesTable: {
			order: r.one.purchaseOrdersTable({
				from: r.goodsReceiptNotesTable.orderId,
				to: r.purchaseOrdersTable.id,
			}),
			location: r.one.locationsTable({
				from: r.goodsReceiptNotesTable.locationId,
				to: r.locationsTable.id,
			}),
			supplier: r.one.suppliersTable({
				from: r.goodsReceiptNotesTable.supplierId,
				to: r.suppliersTable.id,
			}),
			items: r.many.goodsReceiptNoteItemsTable(),
		},

		goodsReceiptNoteItemsTable: {
			grn: r.one.goodsReceiptNotesTable({
				from: r.goodsReceiptNoteItemsTable.grnId,
				to: r.goodsReceiptNotesTable.id,
			}),
			purchaseOrderItem: r.one.purchaseOrderItemsTable({
				from: r.goodsReceiptNoteItemsTable.purchaseOrderItemId,
				to: r.purchaseOrderItemsTable.id,
			}),
			material: r.one.materialsTable({
				from: r.goodsReceiptNoteItemsTable.materialId,
				to: r.materialsTable.id,
			}),
		},

		purchaseInvoicesTable: {
			order: r.one.purchaseOrdersTable({
				from: r.purchaseInvoicesTable.orderId,
				to: r.purchaseOrdersTable.id,
			}),
			supplier: r.one.suppliersTable({
				from: r.purchaseInvoicesTable.supplierId,
				to: r.suppliersTable.id,
			}),
			location: r.one.locationsTable({
				from: r.purchaseInvoicesTable.locationId,
				to: r.locationsTable.id,
			}),
			items: r.many.purchaseInvoiceItemsTable(),
			paymentAllocations: r.many.paymentInvoicesTable(),
		},

		purchaseInvoiceItemsTable: {
			invoice: r.one.purchaseInvoicesTable({
				from: r.purchaseInvoiceItemsTable.invoiceId,
				to: r.purchaseInvoicesTable.id,
			}),
			orderItem: r.one.purchaseOrderItemsTable({
				from: r.purchaseInvoiceItemsTable.purchaseOrderItemId,
				to: r.purchaseOrderItemsTable.id,
			}),
		},

		// ─── Finance ──────────────────────────────────────────────────────

		accountsTable: {
			journalItems: r.many.journalItemsTable(),
			taxes: r.many.taxesTable(),
			payments: r.many.paymentsTable(),
		},
		journalEntriesTable: { items: r.many.journalItemsTable() },
		journalItemsTable: {
			entry: r.one.journalEntriesTable({
				from: r.journalItemsTable.journalEntryId,
				to: r.journalEntriesTable.id,
			}),
			account: r.one.accountsTable({ from: r.journalItemsTable.accountId, to: r.accountsTable.id }),
		},
		expendituresTable: {
			sourceAccount: r.one.accountsTable({
				from: r.expendituresTable.sourceAccountId,
				to: r.accountsTable.id,
				alias: 'sourceAccount',
			}),
			targetAccount: r.one.accountsTable({
				from: r.expendituresTable.targetAccountId,
				to: r.accountsTable.id,
				alias: 'targetAccount',
			}),
			liabilityAccount: r.one.accountsTable({
				from: r.expendituresTable.liabilityAccountId,
				to: r.accountsTable.id,
				alias: 'liabilityAccount',
			}),
			supplier: r.one.suppliersTable({
				from: r.expendituresTable.supplierId,
				to: r.suppliersTable.id,
			}),
			location: r.one.locationsTable({
				from: r.expendituresTable.locationId,
				to: r.locationsTable.id,
			}),
		},

		paymentsTable: {
			account: r.one.accountsTable({ from: r.paymentsTable.accountId, to: r.accountsTable.id }),
			invoiceAllocations: r.many.paymentInvoicesTable(),
		},

		paymentInvoicesTable: {
			payment: r.one.paymentsTable({
				from: r.paymentInvoicesTable.paymentId,
				to: r.paymentsTable.id,
			}),
			salesInvoice: r.one.salesInvoicesTable({
				from: r.paymentInvoicesTable.salesInvoiceId,
				to: r.salesInvoicesTable.id,
			}),
			purchaseInvoice: r.one.purchaseInvoicesTable({
				from: r.paymentInvoicesTable.purchaseInvoiceId,
				to: r.purchaseInvoicesTable.id,
			}),
		},

		// ─── HR ───────────────────────────────────────────────────────────

		attendancesTable: {
			employee: r.one.employeesTable({
				from: r.attendancesTable.employeeId,
				to: r.employeesTable.id,
			}),
			location: r.one.locationsTable({
				from: r.attendancesTable.locationId,
				to: r.locationsTable.id,
			}),
			shift: r.one.shiftsTable({ from: r.attendancesTable.shiftId, to: r.shiftsTable.id }),
		},
		shiftsTable: { attendances: r.many.attendancesTable() },
		payrollBatchesTable: { items: r.many.payrollItemsTable() },
		payrollItemsTable: {
			batch: r.one.payrollBatchesTable({
				from: r.payrollItemsTable.batchId,
				to: r.payrollBatchesTable.id,
			}),
			employee: r.one.employeesTable({
				from: r.payrollItemsTable.employeeId,
				to: r.employeesTable.id,
			}),
			adjustments: r.many.payrollAdjustmentsTable(),
		},
		payrollAdjustmentsTable: {
			payrollItem: r.one.payrollItemsTable({
				from: r.payrollAdjustmentsTable.payrollItemId,
				to: r.payrollItemsTable.id,
			}),
		},
		leaveRequestsTable: {
			employee: r.one.employeesTable({
				from: r.leaveRequestsTable.employeeId,
				to: r.employeesTable.id,
			}),
		},

		// ─── Production ───────────────────────────────────────────────────

		workOrdersTable: {
			recipe: r.one.recipesTable({ from: r.workOrdersTable.recipeId, to: r.recipesTable.id }),
			location: r.one.locationsTable({
				from: r.workOrdersTable.locationId,
				to: r.locationsTable.id,
			}),
		},
	}),
)
