import { and, count, eq } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import type { PaginatedResponse } from '@/lib/types'
import { calculatePaginationMeta } from '@/lib/utils/pagination.util'
import { userRoleAssignments, type NewUserRoleAssignment, type UserRoleAssignment } from '@/database/schema'
import { db } from '@/database'

/**
 * IAM User Role Assignments Service
 * Handles user-role-location assignment business logic
 */
export class IamUserRoleAssignmentsService {
  /**
   * List user role assignments with pagination and filtering
   */
  async list(params: {
    page: number
    limit: number
    userId?: number
    roleId?: number
    locationId?: number
  }): Promise<PaginatedResponse<UserRoleAssignment>> {
    const { page, limit, userId, roleId, locationId } = params
    const offset = (page - 1) * limit

    // Build query conditions
    const conditions = []

    if (userId !== undefined) {
      conditions.push(eq(userRoleAssignments.userId, userId))
    }

    if (roleId !== undefined) {
      conditions.push(eq(userRoleAssignments.roleId, roleId))
    }

    if (locationId !== undefined) {
      conditions.push(eq(userRoleAssignments.locationId, locationId))
    }

    // Combine all conditions with AND
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Execute queries in parallel for better performance
    const [results, totalResult] = await Promise.all([
      db
        .select()
        .from(userRoleAssignments)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(userRoleAssignments.id),
      db.select({ total: count() }).from(userRoleAssignments).where(whereClause),
    ])

    const total = totalResult[0]?.total ?? 0

    return {
      data: results,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Get user role assignment by ID
   */
  async getById(id: number): Promise<UserRoleAssignment> {
    const [assignment] = await db.select().from(userRoleAssignments).where(eq(userRoleAssignments.id, id)).limit(1)

    if (!assignment) {
      throw new NotFoundError(`User role assignment with ID ${id} not found`, 'ASSIGNMENT_NOT_FOUND')
    }

    return assignment
  }

  /**
   * Get all roles for a user at a specific location
   */
  async getUserRolesAtLocation(userId: number, locationId: number): Promise<UserRoleAssignment[]> {
    return db
      .select()
      .from(userRoleAssignments)
      .where(and(eq(userRoleAssignments.userId, userId), eq(userRoleAssignments.locationId, locationId)))
  }

  /**
   * Get all locations where a user has a specific role
   */
  async getUserLocationsForRole(userId: number, roleId: number): Promise<UserRoleAssignment[]> {
    return db
      .select()
      .from(userRoleAssignments)
      .where(and(eq(userRoleAssignments.userId, userId), eq(userRoleAssignments.roleId, roleId)))
  }

  /**
   * Assign a role to a user at a location
   */
  async assign(
    dto: {
      userId: number
      roleId: number
      locationId: number
    },
    assignedBy = 1
  ): Promise<UserRoleAssignment> {
    // Check if assignment already exists
    const [existing] = await db
      .select()
      .from(userRoleAssignments)
      .where(
        and(
          eq(userRoleAssignments.userId, dto.userId),
          eq(userRoleAssignments.roleId, dto.roleId),
          eq(userRoleAssignments.locationId, dto.locationId)
        )
      )
      .limit(1)

    if (existing) {
      throw new ConflictError('User already has this role at this location', 'ASSIGNMENT_EXISTS', {
        userId: dto.userId,
        roleId: dto.roleId,
        locationId: dto.locationId,
      })
    }

    // Create assignment in a transaction
    const [assignment] = await db.transaction(async (tx) => {
      const newAssignment: NewUserRoleAssignment = {
        userId: dto.userId,
        roleId: dto.roleId,
        locationId: dto.locationId,
        assignedBy,
      }

      return tx.insert(userRoleAssignments).values(newAssignment).returning()
    })

    return assignment!
  }

  /**
   * Revoke a role from a user at a location
   */
  async revoke(id: number): Promise<void> {
    const [assignment] = await db.select().from(userRoleAssignments).where(eq(userRoleAssignments.id, id)).limit(1)

    if (!assignment) {
      throw new NotFoundError(`User role assignment with ID ${id} not found`, 'ASSIGNMENT_NOT_FOUND')
    }

    await db.delete(userRoleAssignments).where(eq(userRoleAssignments.id, id))
  }

  /**
   * Revoke all roles from a user at a specific location
   */
  async revokeAllAtLocation(userId: number, locationId: number): Promise<void> {
    await db
      .delete(userRoleAssignments)
      .where(and(eq(userRoleAssignments.userId, userId), eq(userRoleAssignments.locationId, locationId)))
  }

  /**
   * Revoke a specific role from a user across all locations
   */
  async revokeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await db
      .delete(userRoleAssignments)
      .where(and(eq(userRoleAssignments.userId, userId), eq(userRoleAssignments.roleId, roleId)))
  }

  /**
   * Check if a user has a specific role at a location
   */
  async hasRole(userId: number, roleId: number, locationId: number): Promise<boolean> {
    const [assignment] = await db
      .select()
      .from(userRoleAssignments)
      .where(
        and(
          eq(userRoleAssignments.userId, userId),
          eq(userRoleAssignments.roleId, roleId),
          eq(userRoleAssignments.locationId, locationId)
        )
      )
      .limit(1)

    return !!assignment
  }
}
