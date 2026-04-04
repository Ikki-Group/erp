import { record } from '@elysiajs/opentelemetry'
import { eq } from 'drizzle-orm'

import { cache } from '@/core/cache'
import * as core from '@/core/database'
import { db } from '@/db'
import { locationsTable, rolesTable, userAssignmentsTable } from '@/db/schema'

import * as dto from '../dto/user-assignment.dto'

const cacheKey = { byUser: (userId: number) => `iam.user-assignment.user.${userId}` }

// User Assignment Service (Layer 0)
// Handles the mapping between Users, Roles, and Locations.
export class UserAssignmentService {
  // Returns detailed assignments for a user.
  async findByUserId(userId: number): Promise<dto.UserAssignmentDetailDto[]> {
    const result = await record('UserAssignmentService.findByUserId', async () => {
      const data = await cache.wrap(cacheKey.byUser(userId), async () => {
        const rows = await db
          .select({
            id: userAssignmentsTable.id,
            userId: userAssignmentsTable.userId,
            roleId: userAssignmentsTable.roleId,
            locationId: userAssignmentsTable.locationId,
            isDefault: userAssignmentsTable.isDefault,
            roleName: rolesTable.name,
            roleCode: rolesTable.code,
            locationName: locationsTable.name,
            locationCode: locationsTable.code,
          })
          .from(userAssignmentsTable)
          .innerJoin(rolesTable, eq(userAssignmentsTable.roleId, rolesTable.id))
          .innerJoin(locationsTable, eq(userAssignmentsTable.locationId, locationsTable.id))
          .where(eq(userAssignmentsTable.userId, userId))
        return rows.map((r) => dto.UserAssignmentDetailDto.parse(r))
      })
      return data
    })
    return result
  }

  // Atomically replaces all assignments for a user.
  async handleUpsertBulk(userId: number, assignments: dto.UserAssignmentUpsertDto[], actorId: number): Promise<void> {
    await record('UserAssignmentService.handleUpsertBulk', async () => {
      await db.transaction(async (tx) => {
        // Delete all existing assignments for this user.
        await tx.delete(userAssignmentsTable).where(eq(userAssignmentsTable.userId, userId))

        if (assignments.length > 0) {
          // Insert new assignments.
          await tx
            .insert(userAssignmentsTable)
            .values(assignments.map((a) => ({ ...a, userId, ...core.stampCreate(actorId) })))
        }
      })
      await this.clearCache(userId)
    })
  }

  // Clear relevant caches.
  private async clearCache(userId: number) {
    await cache.del(cacheKey.byUser(userId))
  }
}
