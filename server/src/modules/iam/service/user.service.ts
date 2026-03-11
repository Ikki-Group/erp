import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, or } from 'drizzle-orm'

import { cache } from '@/core/cache'
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
} from '@/core/database'
import { UnauthorizedError } from '@/core/http/errors'
import { hashPassword, verifyPassword } from '@/core/password'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { usersTable } from '@/db/schema'

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
  UserOutputDto,
  UserUpdateDto,
} from '../dto'

import type { RoleService } from './role.service'
import type { UserAssignmentService } from './user-assignment.service'

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
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class UserService {
  constructor(
    private readonly roleSvc: RoleService,
    private readonly locationSvc: LocationServiceModule,
    private readonly userAssignmentSvc: UserAssignmentService
  ) {}

  async #getRootAssignments(): Promise<UserAssignmentDetailDto[]> {
    const [allRoles, allLocations] = await Promise.all([this.roleSvc.find(), this.locationSvc.location.find()])
    const superadmin = allRoles.find((r) => r.code === SEED_CONFIG.ROLE_SUPERADMIN_CODE)!

    const rootAssignments: UserAssignmentDetailDto[] = allLocations.map((l) => ({
      isDefault: false,
      location: l,
      role: superadmin,
    }))

    return rootAssignments
  }

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
          await this.userAssignmentSvc.upsertUserAssignments(inserted.id, assignments, d.createdBy)
        }
      }
      void this.clearCache()
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
      const result = await db
        .select()
        .from(usersTable)
        .where(or(eq(usersTable.email, lower), eq(usersTable.username, lower)))
      return takeFirst(result)
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
   * Resolves a user ID to a full select object including assignments.
   */
  async getDetailById(id: number): Promise<UserOutputDto> {
    return record('UserService.getDetailById', async () => {
      const user = await this.findById(id)

      return {
        ...user,
        assignments: user.isRoot ? await this.#getRootAssignments() : await this.userAssignmentSvc.findByUserId(id),
      }
    })
  }

  /**
   * Handler for listing users with pagination.
   */
  async handleList(filter: UserFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<UserOutputDto>> {
    return record('UserService.handleList', async () => {
      const { search, isActive } = filter

      const where = and(
        searchFilter(usersTable.fullname, search),
        typeof isActive === 'boolean' ? eq(usersTable.isActive, isActive) : undefined
      )

      // Fetch paginated users using standard select query
      const result = await paginate<UserDto>({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(usersTable)
            .where(where)
            .orderBy(sortBy(usersTable.updatedAt, 'desc'))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(usersTable).where(where),
      })

      // Batch-fetch assignments for all users in the page
      const userIds = result.data.map((u) => u.id)
      const assignmentMap = await this.userAssignmentSvc.findByUserIds(userIds)
      const assignmentRoot = await this.#getRootAssignments()

      // Build full UserSelectDto with assignments
      const data: UserOutputDto[] = result.data.map((u) => {
        return {
          ...u,
          assignments: u.isRoot ? assignmentRoot : (assignmentMap.get(u.id) ?? []),
        }
      })

      return { data, meta: result.meta }
    })
  }

  /**
   * Detail handler.
   */
  async handleDetail(id: number): Promise<UserOutputDto> {
    return this.getDetailById(id)
  }

  /**
   * Create user handler.
   */
  async handleCreate(data: UserCreateDto, actorId: number): Promise<{ id: number }> {
    return record('UserService.handleCreate', async () => {
      const { password, assignments, email, username, ...rest } = data

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
          await this.userAssignmentSvc.upsertUserAssignments(user.id, assignments, actorId)
        }

        return user
      })

      if (!inserted) throw new Error('Failed to create user')

      void this.clearCache(inserted.id)
      return inserted
    })
  }

  /**
   * Update user handler.
   */
  async handleUpdate(id: number, data: UserUpdateDto, actorId: number): Promise<{ id: number }> {
    return record('UserService.handleUpdate', async () => {
      const existing = await this.findById(id)

      const { password, assignments, email, username, ...rest } = data

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
          await this.userAssignmentSvc.upsertUserAssignments(id, assignments, actorId)
        }
      })

      void this.clearCache(id)
      return { id }
    })
  }

  /**
   * Remove user handler.
   */
  async handleRemove(id: number): Promise<{ id: number }> {
    return record('UserService.handleRemove', async () => {
      await this.findById(id)
      await db.delete(usersTable).where(eq(usersTable.id, id))

      void this.clearCache(id)
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

      void this.clearCache(userId)
      return { id: userId }
    })
  }

  /**
   * Handle password update by ADMIN (bypass old password check).
   */
  async handleAdminUpdatePassword(actorId: number, data: UserAdminUpdatePasswordDto): Promise<{ id: number }> {
    return record('UserService.handleAdminUpdatePassword', async () => {
      const { id: targetUserId, password } = data
      await this.findById(targetUserId)

      const passwordHash = await hashPassword(password)
      const metadata = stampUpdate(actorId)

      await db
        .update(usersTable)
        .set({ passwordHash, ...metadata })
        .where(eq(usersTable.id, targetUserId))

      void this.clearCache(targetUserId)
      return { id: targetUserId }
    })
  }

  /**
   * Helper to clear caches.
   */
  private async clearCache(id?: number) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve()
    ])
  }
}
