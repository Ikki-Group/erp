import { and, count, eq } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/utils/pagination.util'
import { locations, roles, userRoleAssignments } from '@/database/schema'

import { db } from '@/database'

import type { IamSchema } from '../iam.types'

interface IFilter {
  userId?: number
  roleId?: number
  locationId?: number
}

/**
 * Handles user-role-location assignment business logic
 */
export class IamUserRoleAssignmentsService {
  err = {
    NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
    EXISTS: 'ASSIGNMENT_EXISTS',
  }

  /**
   * Builds a dynamic query with filters
   */
  private buildFilteredQuery(filter: IFilter) {
    const { userId, roleId, locationId } = filter
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    return db.select().from(userRoleAssignments).where(whereClause).$dynamic()
  }

  /**
   * Counts total assignments matching the filter criteria
   */
  async count(filter: IFilter): Promise<number> {
    const { userId, roleId, locationId } = filter
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    const [result] = await db.select({ total: count() }).from(userRoleAssignments).where(whereClause)

    return result?.total ?? 0
  }

  /**
   * Lists assignments with pagination
   */
  async listPaginated(
    filter: IFilter,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<typeof userRoleAssignments.$inferSelect>> {
    const { page, limit } = pq

    const [data, total] = await Promise.all([
      withPagination(this.buildFilteredQuery(filter).orderBy(userRoleAssignments.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Lists assignments with role and location details
   */
  async listPaginatedWithDetails(
    filter: IFilter,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<IamSchema.UserRoleAssignmentDetail>> {
    const { page, limit } = pq
    const { userId, roleId, locationId } = filter
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [data, total] = await Promise.all([
      withPagination(
        db
          .select({
            id: userRoleAssignments.id,
            userId: userRoleAssignments.userId,
            roleId: userRoleAssignments.roleId,
            locationId: userRoleAssignments.locationId,
            assignedAt: userRoleAssignments.assignedAt,
            assignedBy: userRoleAssignments.assignedBy,
            role: roles,
            location: {
              id: locations.id,
              code: locations.code,
              name: locations.name,
            },
          })
          .from(userRoleAssignments)
          .leftJoin(roles, eq(userRoleAssignments.roleId, roles.id))
          .leftJoin(locations, eq(userRoleAssignments.locationId, locations.id))
          .where(whereClause)
          .orderBy(userRoleAssignments.id)
          .$dynamic(),
        pq
      ).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Retrieves an assignment by its ID
   */
  async getById(id: number): Promise<typeof userRoleAssignments.$inferSelect> {
    const [assignment] = await db.select().from(userRoleAssignments).where(eq(userRoleAssignments.id, id)).limit(1)

    if (!assignment) {
      throw new NotFoundError(`Assignment with ID ${id} not found`, this.err.NOT_FOUND)
    }

    return assignment
  }

  /**
   * Assigns a role to a user at a location
   */
  async assign(
    dto: {
      userId: number
      roleId: number
      locationId: number
    },
    assignedBy = 1
  ): Promise<typeof userRoleAssignments.$inferSelect> {
    // Check if assignment already exists
    const [existing] = await db
      .select()
      .from(userRoleAssignments)
      .where(and(eq(userRoleAssignments.userId, dto.userId), eq(userRoleAssignments.locationId, dto.locationId)))
      .limit(1)

    if (existing) {
      throw new ConflictError('User already has a role at this location', this.err.EXISTS, {
        userId: dto.userId,
        locationId: dto.locationId,
      })
    }

    // Create assignment in a transaction
    const [assignment] = await db.transaction(async (tx) => {
      const newAssignment: typeof userRoleAssignments.$inferInsert = {
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
   * Revokes a role from a user at a location
   */
  async revoke(id: number): Promise<void> {
    await this.getById(id)
    await db.delete(userRoleAssignments).where(eq(userRoleAssignments.id, id))
  }

  /**
   * Revokes all roles from a user at a specific location
   */
  async revokeAllAtLocation(userId: number, locationId: number): Promise<void> {
    await db
      .delete(userRoleAssignments)
      .where(and(eq(userRoleAssignments.userId, userId), eq(userRoleAssignments.locationId, locationId)))
  }

  /**
   * Revokes all roles from a user
   */
  async revokeAllForUser(userId: number): Promise<void> {
    await db.delete(userRoleAssignments).where(eq(userRoleAssignments.userId, userId))
  }

  /**
   * Syncs user role assignments
   * Replaces all existing assignments with the new ones
   * Used during user create/update operations
   */
  async syncUserRoles(
    userId: number,
    roles: { locationId: number | null; roleId: number }[],
    assignedBy = 1
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete all existing assignments for this user
      await tx.delete(userRoleAssignments).where(eq(userRoleAssignments.userId, userId))

      // Insert new assignments if any
      if (roles.length > 0) {
        const assignments = roles.map((role) => ({
          userId,
          roleId: role.roleId,
          locationId: role.locationId!,
          assignedBy,
        }))

        await tx.insert(userRoleAssignments).values(assignments)
      }
    })
  }
}
