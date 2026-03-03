import { defineRelations } from 'drizzle-orm'

// ─── Imports for Relations ────────────────────────────────────────────────────

import { roles, sessions, userAssignments, users } from './iam'
import { stockSummaries, stockTransactions } from './inventory'
import { locations } from './location'
import { materialCategories, materialConversions, materialLocations, materials, uoms } from './material'

// ─── Re-export Tables & Enums ─────────────────────────────────────────────────

export { locationTypeEnum, materialTypeEnum, transactionTypeEnum } from './_helpers'
export { roles, sessions, userAssignments, users } from './iam'
export { stockSummaries, stockTransactions } from './inventory'
export { locations } from './location'
export { materialCategories, materialConversions, materialLocations, materials, uoms } from './material'

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
  })
)
