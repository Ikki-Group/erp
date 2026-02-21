import { and, count, eq, ilike, not, or } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import { logger } from '@/lib/logger'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/pagination'
import { hashPassword } from '@/lib/utils/password.util'

import { db } from '@/database'
import { locations, roles, userRoleLocations, users } from '@/database/schema'

import type { UserCreateDto, UserDto, UserUpdateDto } from '../dto'

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
  #buildWhereClause(filter: IFilter) {
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
      .limit(2)

    if (existing.length === 0) return
    logger.withMetadata({ existing, selected }).debug("Existing user's email or username is conflict")

    const emailConflict = existing.some((u) => u.email === input.email)
    const usernameConflict = existing.some((u) => u.username === input.username)

    if (emailConflict) throw err.emailExist(input.email!)
    if (usernameConflict) throw err.usernameExist(input.username!)
  }

  async find(filter: IFilter): Promise<UserDto[]> {
    const whereClause = this.#buildWhereClause(filter)
    return db.select().from(users).where(whereClause).orderBy(users.id)
  }

  async count(filter: IFilter): Promise<number> {
    const whereClause = this.#buildWhereClause(filter)
    const [result] = await db.select({ total: count() }).from(users).where(whereClause)
    return result?.total ?? 0
  }

  async listPaginated(filter: IFilter, pq: PaginationQuery): Promise<WithPaginationResult<UserDto>> {
    const { page, limit } = pq
    const whereClause = this.#buildWhereClause(filter)

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

  async findUserAndAccessById(id: number) {
    const rows = await db
      .select({
        user: users,
        role: roles,
        location: locations,
        assignment: userRoleLocations,
      })
      .from(users)
      .leftJoin(userRoleLocations, eq(users.id, userRoleLocations.userId))
      .leftJoin(roles, eq(userRoleLocations.roleId, roles.id))
      .leftJoin(locations, eq(userRoleLocations.locationId, locations.id))
      .where(eq(users.id, id))

    if (rows.length === 0) throw err.notFound(id)

    const user = rows[0]!.user
    const locationsList = rows.flatMap((r) =>
      r.assignment && r.location && r.role
        ? [
            {
              id: r.location.id,
              code: r.location.code,
              name: r.location.name,
              role: r.role.code,
              isDefault: r.assignment.isDefault,
            },
          ]
        : []
    )

    const { passwordHash: _, ...result } = user
    return {
      ...result,
      locations: locationsList,
    }
  }

  async create(input: UserCreateDto, createdBy = 1): Promise<UserDto> {
    const { access, password, ...userData } = input

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

      if (access && access.length > 0) {
        await tx.insert(userRoleLocations).values(
          access.map(({ locationId, roleId }, idx) => ({
            userId: createdUser.id,
            roleId,
            locationId,
            isDefault: idx === 0,
          }))
        )
      }

      return createdUser
    })

    const { passwordHash: _, ...result } = user
    return result as UserDto
  }

  async update(id: number, input: UserUpdateDto, updatedBy = 1): Promise<UserDto> {
    const { access, id: _id, ...userData } = input

    const user = await this.getById(id)
    await this.#checkConflict(input, user)

    const updated = await db.transaction(async (tx) => {
      const [updatedUser] = await tx
        .update(users)
        .set({ ...userData, updatedBy })
        .where(eq(users.id, id))
        .returning()

      if (!updatedUser) throw err.notFound(id)

      // Sync user role locations
      const oldAccess = await tx.select().from(userRoleLocations).where(eq(userRoleLocations.userId, id))

      await tx.delete(userRoleLocations).where(eq(userRoleLocations.userId, id))

      if (access && access.length > 0) {
        const oldAccessMap = new Map(oldAccess.map((item) => [item.locationId, item]))
        let hasDefault = false

        const values = access.map(({ locationId, roleId }, idx) => {
          const old = oldAccessMap.get(locationId)
          const isDefault = old ? old.isDefault : false

          if (isDefault) hasDefault = true

          return {
            userId: id,
            roleId,
            locationId,
            isDefault,
          }
        })

        // If no default found from old data, use the first one as default
        if (!hasDefault && values.length > 0) {
          values[0]!.isDefault = true
        }

        await tx.insert(userRoleLocations).values(values)
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
