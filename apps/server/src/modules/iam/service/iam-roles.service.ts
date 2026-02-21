import { and, count, eq, ilike, not, or } from 'drizzle-orm'

import { BadRequestError, ConflictError, NotFoundError } from '@/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/pagination'

import { db } from '@/database'
import { roles } from '@/database/schema'

import type { RoleDto, RoleMutationDto } from '../dto'

/* ---------------------------------- TYPES --------------------------------- */

interface RoleFilter {
  search?: string
  isSystem?: boolean
}

/* -------------------------------- CONSTANT -------------------------------- */

const err = {
  notFound: (id: number) => new NotFoundError(`Role with ID ${id} not found`),
  codeConflict: (code: string) => new ConflictError(`Role code ${code} already exists`, 'ROLE_CODE_ALREADY_EXISTS'),
  nameConflict: (name: string) => new ConflictError(`Role name ${name} already exists`, 'ROLE_NAME_ALREADY_EXISTS'),
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class IamRolesService {
  #buildWhere(filter: RoleFilter) {
    const { search, isSystem } = filter
    const conditions = []

    if (search) {
      conditions.push(or(ilike(roles.code, `%${search}%`), ilike(roles.name, `%${search}%`)))
    }

    if (isSystem !== undefined) {
      conditions.push(eq(roles.isSystem, isSystem))
    }

    return conditions.length > 0 ? and(...conditions) : undefined
  }

  async #checkConflict(input: Pick<RoleMutationDto, 'code' | 'name'>, existing?: RoleDto): Promise<void> {
    const excludeId = existing?.id
    const conditions = []

    if (!existing || existing.code !== input.code) {
      conditions.push(eq(roles.code, input.code))
    }

    if (!existing || existing.name !== input.name) {
      conditions.push(eq(roles.name, input.name))
    }

    if (conditions.length === 0) return

    const where = excludeId ? and(or(...conditions), not(eq(roles.id, excludeId))) : or(...conditions)

    const found = await db
      .select({ id: roles.id, code: roles.code, name: roles.name })
      .from(roles)
      .where(where)
      .limit(2)

    if (found.length === 0) return

    const codeConflict = found.some((r) => r.code === input.code)
    const nameConflict = found.some((r) => r.name === input.name)

    if (codeConflict) throw err.codeConflict(input.code)
    if (nameConflict) throw err.nameConflict(input.name)
  }

  async find(filter: RoleFilter): Promise<RoleDto[]> {
    const where = this.#buildWhere(filter)
    return db.select().from(roles).where(where).orderBy(roles.id)
  }

  async count(filter: RoleFilter): Promise<number> {
    const where = this.#buildWhere(filter)
    const [result] = await db.select({ total: count() }).from(roles).where(where)
    return result?.total ?? 0
  }

  async listPaginated(filter: RoleFilter, pagination: PaginationQuery): Promise<WithPaginationResult<RoleDto>> {
    const { page, limit } = pagination
    const where = this.#buildWhere(filter)

    const [data, total] = await Promise.all([
      withPagination(db.select().from(roles).where(where).orderBy(roles.id).$dynamic(), pagination).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  async getById(id: number): Promise<RoleDto> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1)

    if (!role) throw err.notFound(id)
    return role
  }

  async create(input: RoleMutationDto, createdBy = 1): Promise<RoleDto> {
    await this.#checkConflict(input)

    const [role] = await db
      .insert(roles)
      .values({
        ...input,
        isSystem: input.isSystem ?? false,
        createdBy,
        updatedBy: createdBy,
      })
      .returning()

    if (!role) throw new Error('Failed to create role')
    return role
  }

  async update(id: number, input: RoleMutationDto, updatedBy = 1): Promise<RoleDto> {
    const role = await this.getById(id)
    if (role.isSystem) throw new BadRequestError("Can't update system role")

    await this.#checkConflict(input, role)

    const [updatedRole] = await db
      .update(roles)
      .set({
        ...input,
        updatedBy,
      })
      .where(eq(roles.id, id))
      .returning()

    if (!updatedRole) throw err.notFound(id)
    return updatedRole
  }

  async delete(id: number): Promise<void> {
    const role = await this.getById(id)
    if (role.isSystem) throw new BadRequestError("Can't delete system role")

    await db.delete(roles).where(eq(roles.id, id))
  }
}
