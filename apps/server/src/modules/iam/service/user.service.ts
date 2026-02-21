import { and, count, eq, ilike, not, or } from 'drizzle-orm'

import { BadRequestError, ConflictError, NotFoundError } from '@/lib/error/http'
import { logger } from '@/lib/logger'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/pagination'
import { hashPassword } from '@/lib/utils/password.util'

import { db } from '@/database'
import { locations, roles, userAssignments, users } from '@/database/schema'

import type {
  UserAssignedInputDto,
  UserCreateDto,
  UserDetailAssignmentDto,
  UserDetailDto,
  UserDto,
  UserFilterDto,
  UserUpdateDto,
} from '../schema'

/* -------------------------------- CONSTANT -------------------------------- */

const err = {
  notFound: (id: number) => new NotFoundError(`User with ID ${id} not found`),
  emailExist: (email: string) => new ConflictError(`Email ${email} already exist`, 'USER_EMAIL_ALREADY_EXISTS'),
  usernameExist: (username: string) =>
    new ConflictError(`Username ${username} already exist`, 'USER_USERNAME_ALREADY_EXISTS'),
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class UserService {
  #buildWhere(filter: UserFilterDto) {
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

  #parseAssignedInput(assignments: UserAssignedInputDto[]): UserAssignedInputDto[] {
    if (assignments.length === 0) return []

    const defaultAssignment = assignments.filter((a) => a.isDefault)
    if (defaultAssignment.length !== 1)
      throw new BadRequestError('User only have one default role and location', 'USER_INVALID_DEFAULT_ASSIGNMENT')

    // check duplicate location
    const uniqueLocations = new Set(assignments.map((a) => a.locationId))
    if (uniqueLocations.size !== assignments.length)
      throw new BadRequestError('Duplicate location found', 'USER_DUPLICATE_LOCATION')

    return assignments
  }

  async #checkConflict(input: { email: string; username: string }, selected?: UserDto): Promise<void> {
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
      .limit(1)

    if (existing.length === 0) return
    logger.withMetadata({ existing, selected }).debug("Existing user's email or username is conflict")

    const emailConflict = existing.some((u) => u.email === input.email)
    const usernameConflict = existing.some((u) => u.username === input.username)

    if (emailConflict) throw err.emailExist(input.email!)
    if (usernameConflict) throw err.usernameExist(input.username!)
  }

  async #buildRootUser(user: UserDto): Promise<UserDetailDto> {
    const [superAdminRole, allLocations] = await Promise.all([
      db.query.roles.findFirst({
        where: (r, { eq }) => eq(r.code, 'SUPERADMIN'),
      }),
      db.select().from(locations),
    ])

    if (!superAdminRole) {
      throw new Error('SUPER_ADMIN role not found')
    }

    const assignments: UserDetailAssignmentDto[] = allLocations.map((location) => ({
      userId: user.id,
      roleId: superAdminRole.id,
      locationId: location.id,
      isDefault: false,

      role: {
        id: superAdminRole.id,
        code: superAdminRole.code,
        name: superAdminRole.name,
      },

      location,
    }))

    return {
      ...user,
      assignments,
    }
  }

  async #buildNonRootUser(user: UserDto): Promise<UserDetailDto> {
    const rows = await db
      .select({
        userId: userAssignments.userId,
        roleId: userAssignments.roleId,
        locationId: userAssignments.locationId,
        isDefault: userAssignments.isDefault,

        roleIdRef: roles.id,
        roleCode: roles.code,
        roleName: roles.name,

        location: locations,
      })
      .from(userAssignments)
      .innerJoin(roles, eq(roles.id, userAssignments.roleId))
      .innerJoin(locations, eq(locations.id, userAssignments.locationId))
      .where(eq(userAssignments.userId, user.id))

    const assignments: UserDetailAssignmentDto[] = rows.map((row) => ({
      userId: row.userId,
      roleId: row.roleId,
      locationId: row.locationId,
      isDefault: row.isDefault,

      role: {
        id: row.roleIdRef,
        code: row.roleCode,
        name: row.roleName,
      },

      location: row.location,
    }))

    return {
      ...user,
      assignments,
    }
  }

  async count(filter: UserFilterDto): Promise<number> {
    const where = this.#buildWhere(filter)
    const [result] = await db.select({ total: count() }).from(users).where(where)
    return result?.total ?? 0
  }

  async find(filter: UserFilterDto): Promise<UserDto[]> {
    const where = this.#buildWhere(filter)
    return db.select().from(users).where(where).orderBy(users.id)
  }

  async findPaginated(filter: UserFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<UserDto>> {
    const where = this.#buildWhere(filter)

    const [data, total] = await Promise.all([
      withPagination(db.select().from(users).where(where).orderBy(users.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(pq, total),
    }
  }

  async findById(id: number): Promise<UserDto> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!user) throw err.notFound(id)
    return user
  }

  async findDetailById(id: number): Promise<UserDetailDto> {
    const user = await this.findById(id)

    if (user.isRoot) return this.#buildRootUser(user)
    return this.#buildNonRootUser(user)
  }

  async create(input: UserCreateDto, createdBy = 1): Promise<UserDto> {
    const { assignments, password, ...userData } = input

    await this.#checkConflict(input)
    const passwordHash = await hashPassword(password)

    const user = await db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(users)
        .values({
          ...userData,
          passwordHash,
          createdBy,
          updatedBy: createdBy,
        })
        .returning()

      if (!createdUser) throw new Error('Failed to create user')

      const parsedAssignments = this.#parseAssignedInput(assignments)
      if (parsedAssignments.length > 0) {
        await tx.insert(userAssignments).values(
          parsedAssignments.map((a) => ({
            userId: createdUser.id,
            roleId: a.roleId,
            locationId: a.locationId,
            isDefault: a.isDefault,
          }))
        )
      }

      return createdUser
    })

    const { passwordHash: _, ...result } = user
    return result as UserDto
  }

  async update(id: number, input: UserUpdateDto, updatedBy = 1): Promise<UserDto> {
    const { assignments, id: _id, ...userData } = input

    const user = await this.findById(id)
    await this.#checkConflict(input, user)

    const updated = await db.transaction(async (tx) => {
      const [updatedUser] = await tx
        .update(users)
        .set({ ...userData, updatedBy })
        .where(eq(users.id, id))
        .returning()

      if (!updatedUser) throw err.notFound(id)

      const parsedAssignments = this.#parseAssignedInput(assignments)
      if (parsedAssignments.length > 0) {
        await tx.delete(userAssignments).where(eq(userAssignments.userId, id))
        await tx.insert(userAssignments).values(
          parsedAssignments.map((a) => ({
            userId: id,
            roleId: a.roleId,
            locationId: a.locationId,
            isDefault: a.isDefault,
          }))
        )
      }

      return updatedUser
    })

    const { passwordHash: _, ...result } = updated
    return result as UserDto
  }

  async delete(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id))
  }
}
