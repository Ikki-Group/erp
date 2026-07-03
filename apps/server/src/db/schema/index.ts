/**
 * Schema barrel — grouped to mirror the `modules/` domain boundaries.
 *
 * One flat file per domain (matching `modules/{name}/`), even when that
 * module has multiple submodules internally (e.g. `iam.ts` holds
 * role+user+assignment, matching `modules/iam/{role,user,assignment}/`).
 * Tables within a file are ordered by dependency (referenced table first).
 *
 * See `docs/ARCHITECTURE.md` (Database Schema Layer) for the full mapping
 * table and rationale, and `_relations.ts` for why we don't use Drizzle's
 * `relations()` API in hot paths.
 */
export * from './_helpers'
export * from './_enums'

// Core
export * from './audit'
export * from './session'
export * from './iam'

// Master data
export * from './location'
export * from './uom'
export * from './tax'
export * from './supplier'
export * from './company'
export * from './sales-type'
export * from './material'
export * from './product'

// Operations
export * from './crm'
export * from './hr'
export * from './finance'
export * from './payment'
export * from './inventory'
export * from './purchasing'
export * from './production'
export * from './recipe'
export * from './sales'

// Integrations
export * from './moka'
