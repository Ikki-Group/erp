import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, inArray, or } from 'drizzle-orm'

import { cache } from '@/lib/cache'
import {
    checkConflict,
    paginate,
    searchFilter,
    sortBy,
    stampCreate,
    stampUpdate,
    takeFirst,
    takeFirstOrThrow,
    type ConflictField,
} from '@/lib/db'
import { UnauthorizedError } from '@/lib/error/http'
import { hashPassword, verifyPassword } from '@/lib/password'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import { locationsTable, rolesTable, userAssignmentsTable, usersTable } from '@/db/schema'

import type { LocationServiceModule } from '@/modules/location/service'

import { SEED_CONFIG } from '@/config/seed-config'
import { db } from '@/db'

import type {
    UserAdminUpdatePasswordDto,
    UserAssignmentDetailDto,
    UserChangePasswordDto,
    UserCreateDto,
    UserDto,
    UserFilterDto,
    UserSelectDto,
    UserUpdateDto,
} from '../dto'

import type { RoleService } from './role.service'

/* -------------------------------- CONSTANTS -------------------------------- */


const uniqueFields: ConflictField<'email' | 'username'>[] = [
  { field: 'email', column: usersTable.email, message: 'Email already exists', code: 'USER_EMAIL_ALREADY_EXISTS' },
  {
    field: 'username',
    column: usersTable.username,
    message: 'Username already exists',
    code: 'USER_USERNAME_ALREADY_EXISTS',
  },
]

const cacheKey = {
  count: 'user.count',
  list: 'user.list',
  byId: (id: number) => `user.byId.${id}`,
  byIdentifier: (identifier: string) => `user.byIdentifier.${identifier}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class UserService {
  constructor(
    private readonly roleSvc: RoleService,
    private readonly locationSvc: LocationServiceModule
  ) {}

  /**
   * Seed users.
   */
  async seed(data: (UserCreateDto & { id?: number; createdBy: number })[]): Promise<void> {
    return record('UserService.seed', async () => {
      for (const d of data) {
        const { password, assignments, ...rest } = d
        const metadata = stampCreate(d.createdBy)
        const passwordHash = await hashPassword(password)

        const [inserted] = await db
          .insert(usersTable)
          .values({
            ...rest,
            passwordHash,
            ...metadata,
          })
          .onConflictDoUpdate({
            target: usersTable.email,
            set: {
              username: d.username,
              fullname: d.fullname,
              passwordHash,
              updatedAt: metadata.updatedAt,
              updatedBy: metadata.updatedBy,
            },
          })
          .returning({ id: usersTable.id })

        if (inserted && assignments?.length > 0) {
          await db.delete(userAssignmentsTable).where(eq(userAssignmentsTable.userId, inserted.id))
          await db.insert(userAssignmentsTable).values(
            assignments.map((a) => ({
              ...a,
              userId: inserted.id,
              ...metadata,
            }))
          )
        }
      }
    })
  }

  /**
   * Basic user lookup by ID.
   */
  async findById(id: number): Promise<UserDto> {
    return record('UserService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const result = await db.select().from(usersTable).where(eq(usersTable.id, id))
        return takeFirstOrThrow(result, `User with ID ${id} not found`, 'USER_NOT_FOUND')
      })
    })
  }

  /**
   * Find user by email or username.
   */
  async findByIdentifier(identifier: string): Promise<UserDto | null> {
    return record('UserService.findByIdentifier', async () => {
      const lower = identifier.toLowerCase()
      return cache.wrap(cacheKey.byIdentifier(lower), async () => {
        const result = await db
          .select()
          .from(usersTable)
          .where(or(eq(usersTable.email, lower), eq(usersTable.username, lower)))
        return takeFirst(result)
      })
    })
  }

  /**
   * Returns total count of users.
   */
  async count(): Promise<number> {
    return record('UserService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        const result = await db.select({ val: count() }).from(usersTable)
        return result[0]?.val ?? 0
      })
    })
  }

  /**
   * Fetches assignments for a user with joined role and location data.
   * Uses explicit joins to avoid relational query type issues.
   */
  private async fetchAssignments(userId: number): Promise<UserAssignmentDetailDto[]> {
    const rows = await db
      .select({
        id: userAssignmentsTable.id,
        locationId: userAssignmentsTable.locationId,
        roleId: userAssignmentsTable.roleId,
        isDefault: userAssignmentsTable.isDefault,
        role: {
          id: rolesTable.id,
          code: rolesTable.code,
          name: rolesTable.name,
          isSystem: rolesTable.isSystem,
          createdBy: rolesTable.createdBy,
          updatedBy: rolesTable.updatedBy,
          createdAt: rolesTable.createdAt,
          updatedAt: rolesTable.updatedAt,
        },
        location: {
          id: locationsTable.id,
          code: locationsTable.code,
          name: locationsTable.name,
          type: locationsTable.type,
          description: locationsTable.description,
          isActive: locationsTable.isActive,
          createdBy: locationsTable.createdBy,
          updatedBy: locationsTable.updatedBy,
          createdAt: locationsTable.createdAt,
          updatedAt: locationsTable.updatedAt,
        },
      })
      .from(userAssignmentsTable)
      .innerJoin(rolesTable, eq(userAssignmentsTable.roleId, rolesTable.id))
      .innerJoin(locationsTable, eq(userAssignmentsTable.locationId, locationsTable.id))
      .where(eq(userAssignmentsTable.userId, userId))

    return rows
  }

  /**
   * Batch fetch assignments for multiple users.
   */
  private async fetchAssignmentsBatch(userIds: number[]): Promise<Map<number, UserAssignmentDetailDto[]>> {
    if (userIds.length === 0) return new Map()

    const rows = await db
      .select({
        userId: userAssignmentsTable.userId,
        id: userAssignmentsTable.id,
        locationId: userAssignmentsTable.locationId,
        roleId: userAssignmentsTable.roleId,
        isDefault: userAssignmentsTable.isDefault,
        role: {
          id: rolesTable.id,
          code: rolesTable.code,
          name: rolesTable.name,
          isSystem: rolesTable.isSystem,
          createdBy: rolesTable.createdBy,
          updatedBy: rolesTable.updatedBy,
          createdAt: rolesTable.createdAt,
          updatedAt: rolesTable.updatedAt,
        },
        location: {
          id: locationsTable.id,
          code: locationsTable.code,
          name: locationsTable.name,
          type: locationsTable.type,
          description: locationsTable.description,
          isActive: locationsTable.isActive,
          createdBy: locationsTable.createdBy,
          updatedBy: locationsTable.updatedBy,
          createdAt: locationsTable.createdAt,
          updatedAt: locationsTable.updatedAt,
        },
      })
      .from(userAssignmentsTable)
      .innerJoin(rolesTable, eq(userAssignmentsTable.roleId, rolesTable.id))
      .innerJoin(locationsTable, eq(userAssignmentsTable.locationId, locationsTable.id))
      .where(inArray(userAssignmentsTable.userId, userIds))

    const map = new Map<number, UserAssignmentDetailDto[]>()
    for (const row of rows) {
      const { userId, ...assignment } = row
      const existing = map.get(userId) ?? []
      existing.push(assignment)
      map.set(userId, existing)
    }

    return map
  }

  /**
   * Resolves a user ID to a full select object including assignments.
   */
  async getDetailById(id: number): Promise<UserSelectDto> {
    return record('UserService.getDetailById', async () => {
      const user = await this.findById(id)

      // If user is root, they automatically have access to ALL locations as SUPERADMIN
      if (user.isRoot) {
        const [allRoles, allLocations] = await Promise.all([this.roleSvc.find(), this.locationSvc.location.find()])
        const superadmin = allRoles.find((r) => r.code === SEED_CONFIG.ROLE_SUPERADMIN_CODE)!

        const rootAssignments: UserAssignmentDetailDto[] = allLocations.map((l) => ({
          id: l.id, // Virtual ID for root assignment (must be > 0 due to zPrimitive.id)
          isDefault: false,
          locationId: l.id,
          roleId: superadmin.id,
          location: l,
          role: superadmin,
        }))

        return {
          ...user,
          assignments: rootAssignments,
        }
      }

      const assignments = await this.fetchAssignments(id)

      return {
        ...user,
        assignments,
      }
    })
  }

  /**
   * Handler for listing users with pagination.
   */
  async handleList(filter: UserFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<UserSelectDto>> {
    return record('UserService.handleList', async () => {
      const { search, isActive } = filter

      const where = and(
        searchFilter(usersTable.fullname, search),
        typeof isActive === 'boolean' ? eq(usersTable.isActive, isActive) : undefined
      )

      // Fetch paginated users using standard select query
      const result = await paginate<UserDto>({
        data: ({ limit, offset }) =>
          db.select().from(usersTable).where(where).orderBy(sortBy(usersTable.updatedAt, 'desc')).limit(limit).offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(usersTable).where(where),
      })

      // Batch-fetch assignments for all users in the page
      const userIds = result.data.map((u) => u.id)
      const assignmentMap = await this.fetchAssignmentsBatch(userIds)

      // Build full UserSelectDto with assignments
      const data: UserSelectDto[] = await Promise.all(
        result.data.map(async (u) => {
          // Root users get dynamically expanded assignments
          if (u.isRoot) {
            return this.getDetailById(u.id)
          }
          return {
            ...u,
            assignments: assignmentMap.get(u.id) ?? [],
          }
        })
      )

      return { data, meta: result.meta }
    })
  }

  /**
   * Detail handler.
   */
  async handleDetail(id: number): Promise<UserSelectDto> {
    return record('UserService.handleDetail', async () => {
      return this.getDetailById(id)
    })
  }

  /**
   * Create user handler.
   */
  async handleCreate(data: UserCreateDto, actorId: number): Promise<{ id: number }> {
    return record('UserService.handleCreate', async () => {
      const { password, assignments, ...rest } = data
      const email = rest.email.toLowerCase().trim()
      const username = rest.username.toLowerCase().trim()

      await checkConflict({
        table: usersTable,
        pkColumn: usersTable.id,
        fields: uniqueFields,
        input: { email, username },
      })

      const passwordHash = await hashPassword(password)
      const metadata = stampCreate(actorId)

      const inserted = await db.transaction(async (tx) => {
        const [user] = await tx
          .insert(usersTable)
          .values({
            ...rest,
            email,
            username,
            passwordHash,
            ...metadata,
          })
          .returning({ id: usersTable.id })

        if (user && assignments?.length > 0) {
          await tx.insert(userAssignmentsTable).values(
            assignments.map((a) => ({
              ...a,
              userId: user.id,
              ...metadata,
            }))
          )
        }

        return user
      })

      if (!inserted) throw new Error('Failed to create user')

      void this.clearCache(inserted.id, email, username)
      return inserted
    })
  }

  /**
   * Update user handler.
   */
  async handleUpdate(id: number, data: UserUpdateDto, actorId: number): Promise<{ id: number }> {
    return record('UserService.handleUpdate', async () => {
      const existing = await this.findById(id)

      const { password, assignments, ...rest } = data
      const email = rest.email ? rest.email.toLowerCase().trim() : existing.email
      const username = rest.username ? rest.username.toLowerCase().trim() : existing.username

      await checkConflict({
        table: usersTable,
        pkColumn: usersTable.id,
        fields: uniqueFields,
        input: { email, username },
        existing,
      })

      const passwordHash = password ? await hashPassword(password) : undefined
      const metadata = stampUpdate(actorId)

      await db.transaction(async (tx) => {
        await tx
          .update(usersTable)
          .set({
            ...rest,
            email,
            username,
            ...(passwordHash && { passwordHash }),
            ...metadata,
          })
          .where(eq(usersTable.id, id))

        if (assignments) {
          const createMetadata = stampCreate(actorId)
          await tx.delete(userAssignmentsTable).where(eq(userAssignmentsTable.userId, id))
          if (assignments.length > 0) {
            await tx.insert(userAssignmentsTable).values(
              assignments.map((a) => ({
                ...a,
                userId: id,
                ...createMetadata,
              }))
            )
          }
        }
      })

      void this.clearCache(id, email, username)
      return { id }
    })
  }

  /**
   * Remove user handler.
   */
  async handleRemove(id: number): Promise<{ id: number }> {
    return record('UserService.handleRemove', async () => {
      const existing = await this.findById(id)

      await db.delete(usersTable).where(eq(usersTable.id, id))

      void this.clearCache(id, existing.email, existing.username)
      return { id }
    })
  }

  /**
   * Handle change password for CURRENT user.
   */
  async handleChangePassword(userId: number, data: UserChangePasswordDto): Promise<{ id: number }> {
    return record('UserService.handleChangePassword', async () => {
      const { oldPassword, newPassword } = data
      const user = await this.findById(userId)

      const isValid = await verifyPassword(oldPassword, user.passwordHash)
      if (!isValid) {
        throw new UnauthorizedError('Invalid old password', 'USER_INVALID_OLD_PASSWORD')
      }

      const passwordHash = await hashPassword(newPassword)
      const metadata = stampUpdate(userId)

      await db
        .update(usersTable)
        .set({ passwordHash, ...metadata })
        .where(eq(usersTable.id, userId))

      void this.clearCache(userId, user.email, user.username)
      return { id: userId }
    })
  }

  /**
   * Handle password update by ADMIN (bypass old password check).
   */
  async handleAdminUpdatePassword(actorId: number, data: UserAdminUpdatePasswordDto): Promise<{ id: number }> {
    return record('UserService.handleAdminUpdatePassword', async () => {
      const { id: targetUserId, password } = data
      const targetUser = await this.findById(targetUserId)

      const passwordHash = await hashPassword(password)
      const metadata = stampUpdate(actorId)

      await db
        .update(usersTable)
        .set({ passwordHash, ...metadata })
        .where(eq(usersTable.id, targetUserId))

      void this.clearCache(targetUserId, targetUser.email, targetUser.username)
      return { id: targetUserId }
    })
  }

  /**
   * Helper to clear caches.
   */
  private async clearCache(id: number, email: string, username: string) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      cache.del(cacheKey.byId(id)),
      cache.del(cacheKey.byIdentifier(email)),
      cache.del(cacheKey.byIdentifier(username)),
    ])
  }
}

