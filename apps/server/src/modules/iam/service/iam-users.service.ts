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

import type { UserCreateDto, UserDto, UserUpdateDto } from '../dto'
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

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class IamUsersService {
  constructor(private userRoleAssignments?: IamUserRoleAssignmentsService) {}

  buildWhereClause(filter: IFilter) {
    const { search, isActive } = filter
    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.username, `%${search}%`),
          ilike(users.fullname, `%${search}%`)
        )
      )
    }

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive))
    }

    return conditions.length > 0 ? and(...conditions) : undefined
  }

  private async checkConflict(input: { email: string; username: string }, selected?: UserDto): Promise<void> {
    const excludeId = selected?.id
    const conditions = []

    if (!selected || selected.username !== input.username) {
      conditions.push(eq(users.username, input.username))
    }

    if (!selected || selected.email !== input.email) {
      conditions.push(eq(users.email, input.email))
    }

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

  async find(filter: IFilter): Promise<UserDto[]> {
    const whereClause = this.buildWhereClause(filter)
    return db.select().from(users).where(whereClause).orderBy(users.id)
  }

  async count(filter: IFilter): Promise<number> {
    const whereClause = this.buildWhereClause(filter)
    const [result] = await db.select({ total: count() }).from(users).where(whereClause)
    return result?.total ?? 0
  }

  async listPaginated(filter: IFilter, pq: PaginationQuery): Promise<WithPaginationResult<UserDto>> {
    const { page, limit } = pq
    const whereClause = this.buildWhereClause(filter)

    const [data, total] = await Promise.all([
      withPagination(db.select().from(users).where(whereClause).orderBy(users.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  async getById(id: number): Promise<UserDto> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!user) throw err.notFound(id)
    return user
  }

  async create(input: UserCreateDto, createdBy = 1): Promise<UserDto> {
    await this.checkConflict(input)

    const passwordHash = await hashPassword(input.password)
    const [user] = await db
      .insert(users)
      .values({
        email: input.email,
        username: input.username,
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

  async update(id: number, input: UserUpdateDto, updatedBy = 1): Promise<UserDto> {
    const user = await this.getById(id)
    await this.checkConflict(input, user)

    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedBy })
      .where(eq(users.id, id))
      .returning()

    if (!updatedUser) throw err.notFound(id)
    return updatedUser
  }

  async delete(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id))
  }
}
