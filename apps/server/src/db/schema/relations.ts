// oxlint-disable import/max-dependencies
// oxlint-disable max-lines
import { defineRelations } from 'drizzle-orm'

import { rolesTable, sessionsTable, userAssignmentsTable, usersTable } from './iam'
import { stockSummariesTable, stockTransactionsTable } from './inventory'
import { locationsTable } from './location'
import {
	attendancesTable,
	payrollAdjustmentsTable,
	payrollBatchesTable,
	payrollItemsTable,
	shiftsTable,
} from './hr'
import {
	materialCategoriesTable,
	materialConversionsTable,
	materialLocationsTable,
	materialsTable,
	uomsTable,
} from './material'
import { mokaConfigurationsTable, mokaScrapHistoriesTable } from './moka'
import {
	productCategoriesTable,
	productExternalMappingsTable,
	productPricesTable,
	productsTable,
	productVariantsTable,
	salesTypesTable,
	variantPricesTable,
} from './product'
import { recipeItemsTable, recipesTable } from './recipe'
import {
	salesExternalRefsTable,
	salesOrderBatchesTable,
	salesOrderItemsTable,
	salesOrdersTable,
	salesVoidsTable,
} from './sales'
import { suppliersTable } from './supplier'
import { employeesTable } from './employee'
import { accountsTable, expendituresTable, journalEntriesTable, journalItemsTable } from './finance'
import {
	goodsReceiptNoteItemsTable,
	goodsReceiptNotesTable,
	purchaseOrderItemsTable,
	purchaseOrdersTable,
	purchaseRequestItemsTable,
	purchaseRequestsTable,
} from './purchasing'
import { workOrdersTable } from './production'

// ═══════════════════════════════════════════════════════════════════════════════
//  RELATIONS (Drizzle v1 — defineRelations API)
//
//  All relations are defined here in a single place to guarantee:
//  1. No circular-import issues between module files
//  2. A single source of truth for the relationship graph
//  3. Easy discoverability when onboarding
// ═══════════════════════════════════════════════════════════════════════════════

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
		salesTypesTable,
		productCategoriesTable,
		productsTable,
		productPricesTable,
		productVariantsTable,
		variantPricesTable,
		productExternalMappingsTable,
		recipesTable,
		recipeItemsTable,
		mokaConfigurationsTable,
		mokaScrapHistoriesTable,
		salesOrdersTable,
		salesOrderBatchesTable,
		salesOrderItemsTable,
		salesVoidsTable,
		salesExternalRefsTable,
		suppliersTable,
		employeesTable,
		accountsTable,
		journalEntriesTable,
		journalItemsTable,
		purchaseRequestsTable,
		purchaseRequestItemsTable,
		purchaseOrdersTable,
		purchaseOrderItemsTable,
		goodsReceiptNoteItemsTable,
		goodsReceiptNotesTable,
		workOrdersTable,
		attendancesTable,
		shiftsTable,
		payrollBatchesTable,
		payrollItemsTable,
		payrollItemsTable,
		payrollAdjustmentsTable,
		expendituresTable,
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
		},

		// ─── Material ─────────────────────────────────────────────────────

		materialCategoriesTable: { materials: r.many.materialsTable() },

		materialsTable: {
			category: r.one.materialCategoriesTable({
				from: r.materialsTable.categoryId,
				to: r.materialCategoriesTable.id,
			}),
			conversions: r.many.materialConversionsTable(),
			materialLocations: r.many.materialLocationsTable(),
			stockTransactions: r.many.stockTransactionsTable(),
			stockSummaries: r.many.stockSummariesTable(),
			recipe: r.many.recipesTable(),
			recipeItems: r.many.recipeItemsTable(),
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

		// ─── Product ──────────────────────────────────────────────────────

		salesTypesTable: {
			variantPrices: r.many.variantPricesTable(),
			productPrices: r.many.productPricesTable(),
			salesOrders: r.many.salesOrdersTable(),
		},

		productCategoriesTable: { products: r.many.productsTable() },

		productsTable: {
			location: r.one.locationsTable({ from: r.productsTable.locationId, to: r.locationsTable.id }),
			category: r.one.productCategoriesTable({
				from: r.productsTable.categoryId,
				to: r.productCategoriesTable.id,
			}),
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
		},

		mokaScrapHistoriesTable: {
			configuration: r.one.mokaConfigurationsTable({
				from: r.mokaScrapHistoriesTable.mokaConfigurationId,
				to: r.mokaConfigurationsTable.id,
			}),
		},

		// ─── Sales ────────────────────────────────────────────────────────

		salesOrdersTable: {
			location: r.one.locationsTable({
				from: r.salesOrdersTable.locationId,
				to: r.locationsTable.id,
			}),
			salesType: r.one.salesTypesTable({
				from: r.salesOrdersTable.salesTypeId,
				to: r.salesTypesTable.id,
			}),
			batches: r.many.salesOrderBatchesTable(),
			items: r.many.salesOrderItemsTable(),
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

		// ─── Finance ──────────────────────────────────────────────────────

		accountsTable: { journalItems: r.many.journalItemsTable() },
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
