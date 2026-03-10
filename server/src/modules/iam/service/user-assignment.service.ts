import { record } from '@elysiajs/opentelemetry'
import { eq, getColumns, inArray } from 'drizzle-orm'

import { stampCreate } from '@/lib/db'
import { arrayToMap } from '@/lib/utils/collection'

import { locationsTable, rolesTable, userAssignmentsTable } from '@/db/schema'

import { db } from '@/db'

import type { UserAssignmentDetailDto, UserAssignmentDto, UserAssignmentUpsertDto } from '../dto'

const userAssignmentDetailQuery = db
  .select({
    ...getColumns(userAssignmentsTable),
    role: rolesTable,
    location: locationsTable,
  })
  .from(userAssignmentsTable)
  .innerJoin(rolesTable, eq(userAssignmentsTable.roleId, rolesTable.id))
  .innerJoin(locationsTable, eq(userAssignmentsTable.locationId, locationsTable.id))
  .$dynamic()

export class UserAssignmentService {
  /**
   * Fetches assignments for a user with joined role and location data.
   */
  async findByUserId(userId: number): Promise<UserAssignmentDetailDto[]> {
    return record('UserAssignmentService.findByUserId', async () => {
      const rows = userAssignmentDetailQuery.where(eq(userAssignmentsTable.userId, userId)).execute()
      return rows
    })
  }

  /**
   * Batch fetch assignments for multiple users.
   */
  async findByUserIds(userIds: number[]): Promise<Map<number, UserAssignmentDetailDto[]>> {
    return record('UserAssignmentService.findByUserIds', async () => {
      if (userIds.length === 0) return new Map()

      const rows = await userAssignmentDetailQuery.where(inArray(userAssignmentsTable.userId, userIds)).execute()
      return arrayToMap(rows, (r) => r.userId)
    })
  }

  /**
   * Upsert user assignments.
   * This clears existing assignments and inserts new ones.
   */
  async upsertUserAssignments(
    userId: number,
    assignments: UserAssignmentUpsertDto[],
    actorId?: number
  ): Promise<UserAssignmentDto[]> {
    return record('UserAssignmentService.upsertUserAssignments', async () => {
      const metadata = stampCreate(actorId || userId)

      // Use a consistent approach: delete then insert
      await this.clearUserAssignments(userId)

      if (assignments.length > 0) {
        return db
          .insert(userAssignmentsTable)
          .values(
            assignments.map((a) => ({
              ...a,
              userId,
              ...metadata,
            }))
          )
          .returning()
      }

      return []
    })
  }

  /**
   * Clear all assignments for a user.
   */
  async clearUserAssignments(userId: number): Promise<UserAssignmentDto[]> {
    return record('UserAssignmentService.clearUserAssignments', async () => {
      return db.delete(userAssignmentsTable).where(eq(userAssignmentsTable.userId, userId)).returning()
    })
  }
}
