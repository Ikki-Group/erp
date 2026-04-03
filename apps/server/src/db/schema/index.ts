/* eslint-disable eslint-plugin-import/max-dependencies */
import { defineRelations } from 'drizzle-orm'
// ─── Imports for Relations ────────────────────────────────────────────────────

import { rolesTable, sessionsTable, userAssignmentsTable, usersTable } from './iam'
import { stockSummariesTable, stockTransactionsTable } from './inventory'
import { locationsTable } from './location'
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
import { accountsTable } from './finance'

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
export { accountsTable, accountTypeEnum } from './finance'
export * from './inventory'

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
  },
  (r) => ({
    // ─── IAM ──────────────────────────────────────────────────────────

    usersTable: { assignments: r.many.userAssignmentsTable(), sessions: r.many.sessionsTable() },

    rolesTable: { userAssignments: r.many.userAssignmentsTable() },

    userAssignmentsTable: {
      user: r.one.usersTable({ from: r.userAssignmentsTable.userId, to: r.usersTable.id }),
      role: r.one.rolesTable({ from: r.userAssignmentsTable.roleId, to: r.rolesTable.id }),
      location: r.one.locationsTable({ from: r.userAssignmentsTable.locationId, to: r.locationsTable.id }),
    },

    sessionsTable: { user: r.one.usersTable({ from: r.sessionsTable.userId, to: r.usersTable.id }) },

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
      category: r.one.materialCategoriesTable({ from: r.materialsTable.categoryId, to: r.materialCategoriesTable.id }),
      conversions: r.many.materialConversionsTable(),
      materialLocations: r.many.materialLocationsTable(),
      stockTransactions: r.many.stockTransactionsTable(),
      stockSummaries: r.many.stockSummariesTable(),
      recipe: r.many.recipesTable(),
      recipeItems: r.many.recipeItemsTable(),
    },

    materialConversionsTable: {
      material: r.one.materialsTable({ from: r.materialConversionsTable.materialId, to: r.materialsTable.id }),
    },

    materialLocationsTable: {
      material: r.one.materialsTable({ from: r.materialLocationsTable.materialId, to: r.materialsTable.id }),
      location: r.one.locationsTable({ from: r.materialLocationsTable.locationId, to: r.locationsTable.id }),
    },

    // ─── Inventory ────────────────────────────────────────────────────

    stockTransactionsTable: {
      material: r.one.materialsTable({ from: r.stockTransactionsTable.materialId, to: r.materialsTable.id }),
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
      material: r.one.materialsTable({ from: r.stockSummariesTable.materialId, to: r.materialsTable.id }),
      location: r.one.locationsTable({ from: r.stockSummariesTable.locationId, to: r.locationsTable.id }),
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
      category: r.one.productCategoriesTable({ from: r.productsTable.categoryId, to: r.productCategoriesTable.id }),
      variants: r.many.productVariantsTable(),
      prices: r.many.productPricesTable(),
      externalMappings: r.many.productExternalMappingsTable(),
      recipe: r.many.recipesTable(),
      salesOrderItems: r.many.salesOrderItemsTable(),
    },

    productPricesTable: {
      product: r.one.productsTable({ from: r.productPricesTable.productId, to: r.productsTable.id }),
      salesType: r.one.salesTypesTable({ from: r.productPricesTable.salesTypeId, to: r.salesTypesTable.id }),
    },

    productVariantsTable: {
      product: r.one.productsTable({ from: r.productVariantsTable.productId, to: r.productsTable.id }),
      prices: r.many.variantPricesTable(),
      recipe: r.many.recipesTable(),
      externalMappings: r.many.productExternalMappingsTable(),
      salesOrderItems: r.many.salesOrderItemsTable(),
    },

    variantPricesTable: {
      variant: r.one.productVariantsTable({ from: r.variantPricesTable.variantId, to: r.productVariantsTable.id }),
      salesType: r.one.salesTypesTable({ from: r.variantPricesTable.salesTypeId, to: r.salesTypesTable.id }),
    },

    productExternalMappingsTable: {
      product: r.one.productsTable({ from: r.productExternalMappingsTable.productId, to: r.productsTable.id }),
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
      material: r.one.materialsTable({ from: r.recipeItemsTable.materialId, to: r.materialsTable.id }),
      uom: r.one.uomsTable({ from: r.recipeItemsTable.uomId, to: r.uomsTable.id }),
    },

    // ─── Moka ─────────────────────────────────────────────────────────

    mokaConfigurationsTable: {
      location: r.one.locationsTable({ from: r.mokaConfigurationsTable.locationId, to: r.locationsTable.id }),
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
      location: r.one.locationsTable({ from: r.salesOrdersTable.locationId, to: r.locationsTable.id }),
      salesType: r.one.salesTypesTable({ from: r.salesOrdersTable.salesTypeId, to: r.salesTypesTable.id }),
      batches: r.many.salesOrderBatchesTable(),
      items: r.many.salesOrderItemsTable(),
      voids: r.many.salesVoidsTable(),
      externalRefs: r.many.salesExternalRefsTable(),
    },

    salesOrderBatchesTable: {
      order: r.one.salesOrdersTable({ from: r.salesOrderBatchesTable.orderId, to: r.salesOrdersTable.id }),
      items: r.many.salesOrderItemsTable(),
    },

    salesOrderItemsTable: {
      order: r.one.salesOrdersTable({ from: r.salesOrderItemsTable.orderId, to: r.salesOrdersTable.id }),
      batch: r.one.salesOrderBatchesTable({ from: r.salesOrderItemsTable.batchId, to: r.salesOrderBatchesTable.id }),
      product: r.one.productsTable({ from: r.salesOrderItemsTable.productId, to: r.productsTable.id }),
      variant: r.one.productVariantsTable({ from: r.salesOrderItemsTable.variantId, to: r.productVariantsTable.id }),
    },

    salesVoidsTable: {
      order: r.one.salesOrdersTable({ from: r.salesVoidsTable.orderId, to: r.salesOrdersTable.id }),
      item: r.one.salesOrderItemsTable({ from: r.salesVoidsTable.itemId, to: r.salesOrderItemsTable.id }),
    },

    salesExternalRefsTable: {
      order: r.one.salesOrdersTable({ from: r.salesExternalRefsTable.orderId, to: r.salesOrdersTable.id }),
    },
  }),
)
