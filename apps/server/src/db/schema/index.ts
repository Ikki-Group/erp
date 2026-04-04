/* eslint-disable eslint-plugin-import/max-dependencies */

// ─── Re-export Tables & Enums ─────────────────────────────────────────────────

export { locationTypeEnum, materialTypeEnum, productStatusEnum, transactionTypeEnum } from './_helpers'
export { rolesTable, sessionsTable, userAssignmentsTable, usersTable } from './iam'
export { stockSummariesTable, stockTransactionsTable } from './inventory'
export { locationsTable } from './location'
export {
  materialCategoriesTable,
  materialConversionsTable,
  materialLocationsTable,
  materialsTable,
  uomsTable,
} from './material'
export {
  productCategoriesTable,
  productExternalMappingsTable,
  productPricesTable,
  productsTable,
  productVariantsTable,
  salesTypesTable,
  variantPricesTable,
} from './product'
export { mokaConfigurationsTable, mokaScrapHistoriesTable, mokaScrapStatusEnum, mokaScrapTypeEnum } from './moka'
export { recipeItemsTable, recipesTable } from './recipe'
export {
  salesExternalRefsTable,
  salesOrderBatchesTable,
  salesOrderItemsTable,
  salesOrdersTable,
  salesOrderStatusEnum,
  salesVoidsTable,
} from './sales'
export { suppliersTable } from './supplier'
export { employeesTable } from './employee'
export { accountTypeEnum, accountsTable, journalEntriesTable, journalItemsTable } from './finance'
export {
  attendanceStatusEnum,
  attendancesTable,
  payrollAdjustmentTypeEnum,
  payrollAdjustmentsTable,
  payrollBatchesTable,
  payrollItemsTable,
  payrollStatusEnum,
  shiftsTable,
} from './hr'
export {
  goodsReceiptNoteItemsTable,
  goodsReceiptNotesTable,
  goodsReceiptStatusEnum,
  purchaseOrderItemsTable,
  purchaseOrdersTable,
  purchaseOrderStatusEnum,
  purchaseRequestItemsTable,
  purchaseRequestsTable,
  purchaseRequestStatusEnum,
} from './purchasing'
export { workOrdersTable, workOrderStatusEnum } from './production'
export * from './inventory'

// ─── Re-export Relations ──────────────────────────────────────────────────────

export { relations } from './relations'
