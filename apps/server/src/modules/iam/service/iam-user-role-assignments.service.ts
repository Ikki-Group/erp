import { and, count, eq } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/utils/pagination.util'

import { db } from '@/database'
import { locations, roles, userRoleAssignments } from '@/database/schema'

import type { IamSchema } from '../iam.schema'

/* ---------------------------------- TYPES --------------------------------- */

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

interface IFilter {
  userId?: number
  roleId?: number
  locationId?: number
}

/* -------------------------------- CONSTANT -------------------------------- */

const err = {
  notFound: (id: number) => new NotFoundError(`Assignment with ID ${id} not found`),
  conflict: () => new ConflictError('User already has a role at this location', 'ASSIGNMENT_ALREADY_EXISTS'),
}

/* --------------------------------- HELPER --------------------------------- */

function buildWhereClause(filter: IFilter) {
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

  return conditions.length > 0 ? and(...conditions) : undefined
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

/**
 * Handles user-role-location assignment business logic
 */
export class IamUserRoleAssignmentsService {
  async count(filter: IFilter): Promise<number> {
    const [result] = await db.select({ total: count() }).from(userRoleAssignments).where(buildWhereClause(filter))
    return result?.total ?? 0
  }

  async listPaginated(
    filter: IFilter,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<typeof userRoleAssignments.$inferSelect>> {
    const { page, limit } = pq
    const whereClause = buildWhereClause(filter)

    const [data, total] = await Promise.all([
      withPagination(
        db.select().from(userRoleAssignments).where(whereClause).orderBy(userRoleAssignments.id).$dynamic(),
        pq
      ).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  async listPaginatedWithDetails(
    filter: IFilter,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<IamSchema.UserRoleAssignmentDetail>> {
    const { page, limit } = pq
    const whereClause = buildWhereClause(filter)

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

    // Mapper to ensure type safety if needed (left joins can return nulls)
    const mappedData: IamSchema.UserRoleAssignmentDetail[] = data.map((item) => ({
      ...item,
      role: item.role as IamSchema.Role | null,
    }))

    return {
      data: mappedData,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  async getById(id: number): Promise<typeof userRoleAssignments.$inferSelect> {
    const [assignment] = await db.select().from(userRoleAssignments).where(eq(userRoleAssignments.id, id)).limit(1)
    if (!assignment) throw err.notFound(id)
    return assignment
  }

  async assign(
    input: {
      userId: number
      roleId: number
      locationId: number
    },
    assignedBy = 1
  ): Promise<typeof userRoleAssignments.$inferSelect> {
    const [existing] = await db
      .select()
      .from(userRoleAssignments)
      .where(and(eq(userRoleAssignments.userId, input.userId), eq(userRoleAssignments.locationId, input.locationId)))
      .limit(1)

    if (existing) throw err.conflict()

    const [assignment] = await db
      .insert(userRoleAssignments)
      .values({
        userId: input.userId,
        roleId: input.roleId,
        locationId: input.locationId,
        assignedBy,
      })
      .returning()

    return assignment!
  }

  async revoke(id: number): Promise<void> {
    await this.getById(id)
    await db.delete(userRoleAssignments).where(eq(userRoleAssignments.id, id))
  }

  async revokeAllForUser(userId: number, tx?: DbTransaction): Promise<void> {
    const client = tx ?? db
    await client.delete(userRoleAssignments).where(eq(userRoleAssignments.userId, userId))
  }

  /**
   * Syncs user role assignments
   * Replaces all existing assignments with the new ones
   */
  async syncUserRoles(
    userId: number,
    roles: { locationId: number; roleId: number }[],
    assignedBy = 1,
    tx?: DbTransaction
  ): Promise<void> {
    const execute = async (client: DbTransaction) => {
      // 1. Delete all existing assignments for this user
      await client.delete(userRoleAssignments).where(eq(userRoleAssignments.userId, userId))

      // 2. Insert new assignments if any
      if (roles.length > 0) {
        const assignments = roles.map((role) => ({
          userId,
          roleId: role.roleId,
          locationId: role.locationId,
          assignedBy,
        }))

        await client.insert(userRoleAssignments).values(assignments)
      }
    }

    await (tx ? execute(tx) : db.transaction(async (t) => await execute(t)))
  }
}
