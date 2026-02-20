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

interface IFilter {
  search?: string
  isSystem?: boolean
}

/* -------------------------------- CONSTANT -------------------------------- */

const err = {
  idNotFound: (id: number) => new NotFoundError(`Role not found ${id}`),
  codeNotFound: (code: string) => new NotFoundError(`Role code ${code} not found`),
  codeExist: (code: string) => new ConflictError(`Code ${code} exist`, 'ROLE_CODE_ALREADY_EXISTS'),
  nameExist: (name: string) => new ConflictError(`Name ${name} exist`, 'ROLE_NAME_ALREADY_EXISTS'),
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class IamRolesService {
  buildWhereClause(filter: IFilter) {
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

  private async checkConflict(input: { code: string; name: string }, excludeId?: number): Promise<void> {
    const conditions = [eq(roles.code, input.code), eq(roles.name, input.name)]
    const whereClause = excludeId ? and(or(...conditions), not(eq(roles.id, excludeId))) : or(...conditions)

    const existing = await db
      .select({ id: roles.id, code: roles.code, name: roles.name })
      .from(roles)
      .where(whereClause)
      .limit(2)

    if (existing.length === 0) return

    const codeExists = existing.some((r) => r.code === input.code)
    const nameExists = existing.some((r) => r.name === input.name)

    if (codeExists) throw err.codeExist(input.code)
    if (nameExists) throw err.nameExist(input.name)
  }

  async find(filter: IFilter): Promise<RoleDto[]> {
    const whereClause = this.buildWhereClause(filter)
    return db.select().from(roles).where(whereClause).orderBy(roles.id)
  }

  async count(filter: IFilter): Promise<number> {
    const whereClause = this.buildWhereClause(filter)
    const [result] = await db.select({ total: count() }).from(roles).where(whereClause)
    return result?.total ?? 0
  }

  async listPaginated(filter: IFilter, pq: PaginationQuery): Promise<WithPaginationResult<RoleDto>> {
    const { page, limit } = pq
    const whereClause = this.buildWhereClause(filter)

    const [data, total] = await Promise.all([
      withPagination(db.select().from(roles).where(whereClause).orderBy(roles.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  async getById(id: number): Promise<RoleDto> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1)

    if (!role) throw err.idNotFound(id)
    return role
  }

  async create(input: RoleMutationDto, createdBy = 1): Promise<RoleDto> {
    await this.checkConflict(input)

    const [role] = await db
      .insert(roles)
      .values({
        code: input.code,
        name: input.name,
        isSystem: input.isSystem ?? false,
        createdBy,
        updatedBy: createdBy,
      })
      .returning()

    if (!role) throw new Error('Failed to create role')
    return role
  }

  async update(id: number, input: RoleMutationDto, updatedBy = 1): Promise<RoleDto> {
    await this.checkConflict(input, id)

    const [updatedRole] = await db
      .update(roles)
      .set({
        code: input.code,
        name: input.name,
        updatedBy,
      })
      .where(eq(roles.id, id))
      .returning()

    if (!updatedRole) throw err.idNotFound(id)
    return updatedRole
  }

  async delete(id: number): Promise<void> {
    const role = await this.getById(id)
    if (role.isSystem) throw new BadRequestError("Can't delete system role")

    await db.delete(roles).where(eq(roles.id, id))
  }
}
