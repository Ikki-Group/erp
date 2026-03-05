import { defineRelations } from 'drizzle-orm'

// ─── Imports for Relations ────────────────────────────────────────────────────

import { roles, sessions, userAssignments, users } from './iam'
import { stockSummaries, stockTransactions } from './inventory'
import { locations } from './location'
import { materialCategories, materialConversions, materialLocations, materials, uoms } from './material'
import { productCategories, products, productVariants, salesTypes, variantPrices } from './product'
import { recipeItems, recipes } from './recipe'

// ─── Re-export Tables & Enums ─────────────────────────────────────────────────

export { locationTypeEnum, materialTypeEnum, productStatusEnum, transactionTypeEnum } from './_helpers'
export { roles, sessions, userAssignments, users } from './iam'
export { stockSummaries, stockTransactions } from './inventory'
export { locations } from './location'
export { materialCategories, materialConversions, materialLocations, materials, uoms } from './material'
export { productCategories, products, productVariants, salesTypes, variantPrices } from './product'
export { recipeItems, recipes } from './recipe'

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
    users,
    roles,
    userAssignments,
    sessions,
    locations,
    uoms,
    materialCategories,
    materials,
    materialConversions,
    materialLocations,
    stockTransactions,
    stockSummaries,
    salesTypes,
    productCategories,
    products,
    productVariants,
    variantPrices,
    recipes,
    recipeItems,
  },
  (r) => ({
    // ─── IAM ──────────────────────────────────────────────────────────

    users: {
      assignments: r.many.userAssignments(),
      sessions: r.many.sessions(),
    },

    roles: {
      userAssignments: r.many.userAssignments(),
    },

    userAssignments: {
      user: r.one.users({
        from: r.userAssignments.userId,
        to: r.users.id,
      }),
      role: r.one.roles({
        from: r.userAssignments.roleId,
        to: r.roles.id,
      }),
      location: r.one.locations({
        from: r.userAssignments.locationId,
        to: r.locations.id,
      }),
    },

    sessions: {
      user: r.one.users({
        from: r.sessions.userId,
        to: r.users.id,
      }),
    },

    // ─── Location ─────────────────────────────────────────────────────

    locations: {
      userAssignments: r.many.userAssignments(),
      materialLocations: r.many.materialLocations(),
      stockTransactions: r.many.stockTransactions({
        alias: 'location',
      }),
      stockSummaries: r.many.stockSummaries(),
      products: r.many.products(),
    },

    // ─── Material ─────────────────────────────────────────────────────

    materialCategories: {
      materials: r.many.materials(),
    },

    materials: {
      category: r.one.materialCategories({
        from: r.materials.categoryId,
        to: r.materialCategories.id,
      }),
      conversions: r.many.materialConversions(),
      materialLocations: r.many.materialLocations(),
      stockTransactions: r.many.stockTransactions(),
      stockSummaries: r.many.stockSummaries(),
      recipe: r.many.recipes(),
      recipeItems: r.many.recipeItems(),
    },

    materialConversions: {
      material: r.one.materials({
        from: r.materialConversions.materialId,
        to: r.materials.id,
      }),
    },

    materialLocations: {
      material: r.one.materials({
        from: r.materialLocations.materialId,
        to: r.materials.id,
      }),
      location: r.one.locations({
        from: r.materialLocations.locationId,
        to: r.locations.id,
      }),
    },

    // ─── Inventory ────────────────────────────────────────────────────

    stockTransactions: {
      material: r.one.materials({
        from: r.stockTransactions.materialId,
        to: r.materials.id,
      }),
      location: r.one.locations({
        from: r.stockTransactions.locationId,
        to: r.locations.id,
        alias: 'location',
      }),
      counterpartLocation: r.one.locations({
        from: r.stockTransactions.counterpartLocationId,
        to: r.locations.id,
        alias: 'counterpartLocation',
      }),
    },

    stockSummaries: {
      material: r.one.materials({
        from: r.stockSummaries.materialId,
        to: r.materials.id,
      }),
      location: r.one.locations({
        from: r.stockSummaries.locationId,
        to: r.locations.id,
      }),
    },

    // ─── Product ──────────────────────────────────────────────────────

    salesTypes: {
      variantPrices: r.many.variantPrices(),
    },

    productCategories: {
      products: r.many.products(),
    },

    products: {
      location: r.one.locations({
        from: r.products.locationId,
        to: r.locations.id,
      }),
      category: r.one.productCategories({
        from: r.products.categoryId,
        to: r.productCategories.id,
      }),
      variants: r.many.productVariants(),
    },

    productVariants: {
      product: r.one.products({
        from: r.productVariants.productId,
        to: r.products.id,
      }),
      prices: r.many.variantPrices(),
      recipe: r.many.recipes(),
    },

    variantPrices: {
      variant: r.one.productVariants({
        from: r.variantPrices.variantId,
        to: r.productVariants.id,
      }),
      salesType: r.one.salesTypes({
        from: r.variantPrices.salesTypeId,
        to: r.salesTypes.id,
      }),
    },

    // ─── Recipe ───────────────────────────────────────────────────────

    recipes: {
      material: r.one.materials({
        from: r.recipes.materialId,
        to: r.materials.id,
      }),
      productVariant: r.one.productVariants({
        from: r.recipes.productVariantId,
        to: r.productVariants.id,
      }),
      items: r.many.recipeItems(),
    },

    recipeItems: {
      recipe: r.one.recipes({
        from: r.recipeItems.recipeId,
        to: r.recipes.id,
      }),
      material: r.one.materials({
        from: r.recipeItems.materialId,
        to: r.materials.id,
      }),
    },
  })
)
