import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import type {
  locationMaterials,
  locations,
  materials,
  materialUoms,
  roles,
  uoms,
  userRoleAssignments,
  users,
} from './schema'

/**
 * Database Type Utilities
 *
 * This file exports type-safe database types for all tables.
 * These types are automatically inferred from the Drizzle schema definitions.
 *
 * Usage:
 * - SelectModel: Type for data retrieved from database (includes all fields)
 * - InsertModel: Type for data being inserted (excludes auto-generated fields)
 */

// ============================================================================
// IAM (Identity and Access Management)
// ============================================================================

export type User = InferSelectModel<typeof users>
export type InsertUser = InferInsertModel<typeof users>

export type Role = InferSelectModel<typeof roles>
export type InsertRole = InferInsertModel<typeof roles>

export type UserRoleAssignment = InferSelectModel<typeof userRoleAssignments>
export type InsertUserRoleAssignment = InferInsertModel<typeof userRoleAssignments>

// ============================================================================
// Location Management
// ============================================================================

export type Location = InferSelectModel<typeof locations>
export type InsertLocation = InferInsertModel<typeof locations>

// ============================================================================
// Inventory Management
// ============================================================================

export type Material = InferSelectModel<typeof materials>
export type InsertMaterial = InferInsertModel<typeof materials>

export type Uom = InferSelectModel<typeof uoms>
export type InsertUom = InferInsertModel<typeof uoms>

export type MaterialUom = InferSelectModel<typeof materialUoms>
export type InsertMaterialUom = InferInsertModel<typeof materialUoms>

export type LocationMaterial = InferSelectModel<typeof locationMaterials>
export type InsertLocationMaterial = InferInsertModel<typeof locationMaterials>

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Utility type for partial updates
 * Excludes id, createdAt, and other auto-generated fields
 */
export type UpdateModel<T> = Partial<Omit<T, 'id' | 'createdAt'>>

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
