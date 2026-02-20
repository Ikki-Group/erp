import { and, count, eq, ilike, not, or } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/pagination'
import { hashPassword } from '@/lib/utils/password.util'

import { db } from '@/database'
import { users } from '@/database/schema'

import type { IamSchema } from '@/modules/iam/iam.schema'

import type { IamUserRoleAssignmentsService } from './iam-user-role-assignments.service'

/* ---------------------------------- TYPES --------------------------------- */

interface IFilter {
  search?: string
  isActive?: boolean
}

/* -------------------------------- CONSTANT -------------------------------- */

const err = {
  notFound: (id: number) => new NotFoundError(`User with ID ${id} not found`),
  emailExist: (email: string) => new ConflictError(`Email ${email} already exist`, 'USER_EMAIL_ALREADY_EXISTS'),
  usernameExist: (username: string) =>
    new ConflictError(`Username ${username} already exist`, 'USER_USERNAME_ALREADY_EXISTS'),
}

/* --------------------------------- HELPER --------------------------------- */

function buildWhereClause(filter: IFilter) {
  const { search, isActive } = filter
  const conditions = []

  if (search) {
    conditions.push(
      or(ilike(users.email, `%${search}%`), ilike(users.username, `%${search}%`), ilike(users.fullname, `%${search}%`))
    )
  }

  if (isActive !== undefined) {
    conditions.push(eq(users.isActive, isActive))
  }

  return conditions.length > 0 ? and(...conditions) : undefined
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class IamUsersService {
  constructor(private userRoleAssignments?: IamUserRoleAssignmentsService) {}

  /**
   * Helper to ensure a user is not a root user
   */
  private ensureNotRoot(user: IamSchema.User, action: 'update' | 'delete'): void {
    if (user.isRoot) {
      throw new ConflictError(`Cannot ${action} root user`, `ROOT_USER_${action.toUpperCase()}_FORBIDDEN`, {
        userId: user.id,
      })
    }
  }

  /**
   * Helper to check for email or username conflicts
   */
  private async checkConflict(input: { email?: string; username?: string }, excludeId?: number): Promise<void> {
    const conditions = []
    if (input.email) conditions.push(eq(users.email, input.email.toLowerCase().trim()))
    if (input.username) conditions.push(eq(users.username, input.username.toLowerCase().trim()))

    if (conditions.length === 0) return

    const whereClause = excludeId ? and(or(...conditions), not(eq(users.id, excludeId))) : or(...conditions)

    const existing = await db
      .select({ id: users.id, email: users.email, username: users.username })
      .from(users)
      .where(whereClause)
      .limit(2)

    if (existing.length === 0) return

    const emailConflict = input.email && existing.some((u) => u.email === input.email?.toLowerCase().trim())
    const usernameConflict = input.username && existing.some((u) => u.username === input.username?.toLowerCase().trim())

    if (emailConflict) throw err.emailExist(input.email!)
    if (usernameConflict) throw err.usernameExist(input.username!)
  }

  async find(filter: IFilter): Promise<IamSchema.User[]> {
    const whereClause = buildWhereClause(filter)
    return db.select().from(users).where(whereClause).orderBy(users.id)
  }

  async count(filter: IFilter): Promise<number> {
    const whereClause = buildWhereClause(filter)
    const [result] = await db.select({ total: count() }).from(users).where(whereClause)
    return result?.total ?? 0
  }

  async listPaginated(filter: IFilter, pq: PaginationQuery): Promise<WithPaginationResult<IamSchema.User>> {
    const { page, limit } = pq
    const whereClause = buildWhereClause(filter)

    const [data, total] = await Promise.all([
      withPagination(db.select().from(users).where(whereClause).orderBy(users.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  async getById(id: number): Promise<IamSchema.User> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!user) throw err.notFound(id)
    return user
  }

  async getByEmail(email: string): Promise<IamSchema.User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1)
    return user ?? null
  }

  async getByUsername(username: string): Promise<IamSchema.User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username.toLowerCase().trim())).limit(1)
    return user ?? null
  }

  async create(
    input: Pick<IamSchema.User, 'email' | 'username' | 'fullname'> & { password: string },
    createdBy = 1
  ): Promise<IamSchema.User> {
    await this.checkConflict(input)

    const passwordHash = await hashPassword(input.password)

    const [user] = await db
      .insert(users)
      .values({
        email: input.email.toLowerCase().trim(),
        username: input.username.toLowerCase().trim(),
        fullname: input.fullname.trim(),
        passwordHash,
        isRoot: false,
        isActive: true,
        createdBy,
        updatedBy: createdBy,
      })
      .returning()

    if (!user) throw new Error('Failed to create user')
    return user
  }

  async update(
    id: number,
    input: Partial<Pick<IamSchema.User, 'email' | 'username' | 'fullname' | 'isActive'>> & { password?: string },
    updatedBy = 1
  ): Promise<IamSchema.User> {
    const user = await this.getById(id)

    this.ensureNotRoot(user, 'update')
    // For now matching roles pattern: check conflict
    await this.checkConflict(input, id)

    const updateData: Partial<typeof users.$inferInsert> = {
      updatedBy,
      updatedAt: new Date(),
    }

    if (input.email) updateData.email = input.email.toLowerCase().trim()
    if (input.username) updateData.username = input.username.toLowerCase().trim()
    if (input.fullname) updateData.fullname = input.fullname.trim()
    if (input.isActive !== undefined) updateData.isActive = input.isActive
    if (input.password) {
      updateData.passwordHash = await hashPassword(input.password)
    }

    const [updatedUser] = await db.update(users).set(updateData).where(eq(users.id, id)).returning()

    if (!updatedUser) throw err.notFound(id)
    return updatedUser
  }

  async delete(id: number): Promise<void> {
    const user = await this.getById(id)
    this.ensureNotRoot(user, 'delete')

    await db.delete(users).where(eq(users.id, id))
  }

  async toggleActive(id: number, updatedBy = 1): Promise<IamSchema.User> {
    const user = await this.getById(id)

    const [updatedUser] = await db
      .update(users)
      .set({
        isActive: !user.isActive,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    if (!updatedUser) throw err.notFound(id)
    return updatedUser
  }

  /**
   * Complex operation: Create user and assign roles
   */
  async createWithRoles(input: IamSchema.UserCreateDto, createdBy = 1): Promise<IamSchema.User> {
    if (!this.userRoleAssignments) {
      throw new Error('UserRoleAssignments service not initialized')
    }

    const userRoleAssignments = this.userRoleAssignments

    return await db.transaction(async (tx) => {
      // 1. Create User
      await this.checkConflict(input)
      const passwordHash = await hashPassword(input.password)

      const [user] = await tx
        .insert(users)
        .values({
          email: input.email.toLowerCase().trim(),
          username: input.username.toLowerCase().trim(),
          fullname: input.fullname.trim(),
          passwordHash,
          isRoot: input.isRoot ?? false,
          isActive: input.isActive ?? true,
          createdBy,
          updatedBy: createdBy,
        })
        .returning()

      if (!user) throw new Error('Failed to create user')

      // 2. Assign Roles
      const validRoles = input.roles.filter((r) => r.locationId !== null) as {
        locationId: number
        roleId: number
      }[]

      if (validRoles.length > 0) {
        await userRoleAssignments.syncUserRoles(user.id, validRoles, createdBy, tx)
      }

      return user
    })
  }

  /**
   * Complex operation: Update user and sync roles
   */
  async updateWithRoles(id: number, input: IamSchema.UserUpdateDto, updatedBy = 1): Promise<IamSchema.User> {
    if (!this.userRoleAssignments) {
      throw new Error('UserRoleAssignments service not initialized')
    }

    const userRoleAssignments = this.userRoleAssignments

    return await db.transaction(async (tx) => {
      // 1. Update User Basic Info
      await this.checkConflict(input, id)

      const updateData: Partial<typeof users.$inferInsert> = {
        updatedBy,
        updatedAt: new Date(),
      }

      if (input.email) updateData.email = input.email.toLowerCase().trim()
      if (input.username) updateData.username = input.username.toLowerCase().trim()
      if (input.fullname) updateData.fullname = input.fullname.trim()
      if (input.isActive !== undefined) updateData.isActive = input.isActive
      if (input.isRoot !== undefined) updateData.isRoot = input.isRoot
      if (input.password) {
        updateData.passwordHash = await hashPassword(input.password)
      }

      const [user] = await tx.update(users).set(updateData).where(eq(users.id, id)).returning()

      if (!user) throw err.notFound(id)

      // 2. Sync Roles if provided
      if (input.roles !== undefined) {
        const validRoles = input.roles.filter((r) => r.locationId !== null) as {
          locationId: number
          roleId: number
        }[]
        await userRoleAssignments.syncUserRoles(user.id, validRoles, updatedBy, tx)
      }

      return user
    })
  }
}
