import { and, count, eq, ilike, not, or } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/pagination'

import { db } from '@/database'
import { roles } from '@/database/schema'

import type { IamSchema } from '../iam.schema'

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

/* --------------------------------- HELPER --------------------------------- */

function buildWhereClause(filter: IFilter) {
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

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class IamRolesService {
  /**
   * Helper to ensure a role is not a system role
   */
  private ensureNotSystem(role: typeof roles.$inferSelect, action: 'update' | 'delete'): void {
    if (role.isSystem) {
      const code = action === 'update' ? 'SYSTEM_ROLE_UPDATE_FORBIDDEN' : 'SYSTEM_ROLE_DELETE_FORBIDDEN'
      throw new ConflictError(`Cannot ${action} system role`, code, { roleId: role.id })
    }
  }

  /**
   * Helper to check for code or name conflicts
   */
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

  async find(filter: IFilter): Promise<IamSchema.Role[]> {
    const whereClause = buildWhereClause(filter)
    return db.select().from(roles).where(whereClause).orderBy(roles.id)
  }

  async count(filter: IFilter): Promise<number> {
    const whereClause = buildWhereClause(filter)
    const [result] = await db.select({ total: count() }).from(roles).where(whereClause)
    return result?.total ?? 0
  }

  async listPaginated(filter: IFilter, pq: PaginationQuery): Promise<WithPaginationResult<IamSchema.Role>> {
    const { page, limit } = pq
    const whereClause = buildWhereClause(filter)

    const [data, total] = await Promise.all([
      withPagination(db.select().from(roles).where(whereClause).orderBy(roles.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  async getById(id: number): Promise<IamSchema.Role> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1)

    if (!role) throw err.idNotFound(id)
    return role
  }

  async create(input: Pick<IamSchema.Role, 'code' | 'name' | 'isSystem'>, createdBy = 1): Promise<IamSchema.Role> {
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

  async update(id: number, input: Pick<IamSchema.Role, 'code' | 'name'>, updatedBy = 1): Promise<IamSchema.Role> {
    const role = await this.getById(id)

    this.ensureNotSystem(role, 'update')
    await this.checkConflict(input, id)

    const [updatedRole] = await db
      .update(roles)
      .set({
        code: input.code,
        name: input.name,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning()

    if (!updatedRole) throw err.idNotFound(id)
    return updatedRole
  }

  async delete(id: number): Promise<void> {
    const role = await this.getById(id)
    this.ensureNotSystem(role, 'delete')

    await db.delete(roles).where(eq(roles.id, id))
  }
}
