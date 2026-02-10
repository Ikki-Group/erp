import { and, count, eq, ilike, or } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/utils/pagination.util'
import { roles } from '@/database/schema'
import { db } from '@/database'

interface IFilter {
  search?: string
  isSystem?: boolean
}

/**
 * Handles all role-related business logic including CRUD operations
 */
export class IamRolesService {
  err = {
    NOT_FOUND: 'ROLE_NOT_FOUND',
    CODE_EXISTS: 'ROLE_CODE_EXISTS',
    NAME_EXISTS: 'ROLE_NAME_EXISTS',
    CODE_NAME_EXISTS: 'ROLE_CODE_NAME_EXISTS',
    SYSTEM_ROLE_UPDATE_FORBIDDEN: 'SYSTEM_ROLE_UPDATE_FORBIDDEN',
    SYSTEM_ROLE_DELETE_FORBIDDEN: 'SYSTEM_ROLE_DELETE_FORBIDDEN',
  }

  /**
   * Builds a dynamic query with filters
   * Returns a query builder that can be further modified
   */
  private buildFilteredQuery(filter: IFilter) {
    const { search, isSystem } = filter
    const conditions = []

    if (search) {
      conditions.push(or(ilike(roles.code, `%${search}%`), ilike(roles.name, `%${search}%`)))
    }

    if (isSystem !== undefined) {
      conditions.push(eq(roles.isSystem, isSystem))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    return db.select().from(roles).where(whereClause).$dynamic()
  }

  /**
   * Lists all roles matching the filter criteria
   */
  list(filter: IFilter) {
    return this.buildFilteredQuery(filter).orderBy(roles.id)
  }

  /**
   * Counts total roles matching the filter criteria
   */
  async count(filter: IFilter): Promise<number> {
    const { search, isSystem } = filter
    const conditions = []

    if (search) {
      conditions.push(or(ilike(roles.code, `%${search}%`), ilike(roles.name, `%${search}%`)))
    }

    if (isSystem !== undefined) {
      conditions.push(eq(roles.isSystem, isSystem))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    const [result] = await db.select({ total: count() }).from(roles).where(whereClause)

    return result?.total ?? 0
  }

  /**
   * Lists roles with pagination
   * Executes data fetch and count in parallel for better performance
   */
  async listPaginated(filter: IFilter, pq: PaginationQuery): Promise<WithPaginationResult<typeof roles.$inferSelect>> {
    const { page, limit } = pq

    const [data, total] = await Promise.all([
      withPagination(this.buildFilteredQuery(filter).orderBy(roles.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Retrieves a role by its ID
   * Throws NotFoundError if role doesn't exist
   */
  async getById(id: number): Promise<typeof roles.$inferSelect> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1)

    if (!role) {
      throw new NotFoundError(`Role with ID ${id} not found`, 'ROLE_NOT_FOUND')
    }

    return role
  }

  /**
   * Retrieves a role by its code
   * Returns null if not found
   */
  async getByCode(code: string): Promise<typeof roles.$inferSelect | null> {
    const [role] = await db.select().from(roles).where(eq(roles.code, code)).limit(1)
    return role ?? null
  }

  /**
   * Creates a new role with validation
   * Checks for code and name uniqueness before creation
   */
  async create(
    dto: {
      code: string
      name: string
      isSystem?: boolean
    },
    createdBy = 1
  ): Promise<typeof roles.$inferSelect> {
    // Check for existing code or name in a single query
    const existing = await db
      .select({ code: roles.code, name: roles.name })
      .from(roles)
      .where(or(eq(roles.code, dto.code), eq(roles.name, dto.name)))
      .limit(2)

    // Check for conflicts
    const codeExists = existing.some((r) => r.code === dto.code)
    const nameExists = existing.some((r) => r.name === dto.name)

    if (codeExists && nameExists) {
      throw new ConflictError('Role code and name already exist', 'ROLE_CODE_NAME_EXISTS', {
        code: dto.code,
        name: dto.name,
      })
    }

    if (codeExists) {
      throw new ConflictError('Role with this code already exists', 'ROLE_CODE_EXISTS', {
        code: dto.code,
      })
    }

    if (nameExists) {
      throw new ConflictError('Role with this name already exists', 'ROLE_NAME_EXISTS', {
        name: dto.name,
      })
    }

    // Create role in a transaction
    const [role] = await db.transaction(async (tx) => {
      const newRole: typeof roles.$inferInsert = {
        code: dto.code.toUpperCase().trim(),
        name: dto.name.trim(),
        isSystem: dto.isSystem ?? false,
        createdBy,
        updatedBy: createdBy,
      }

      return tx.insert(roles).values(newRole).returning()
    })

    return role!
  }

  /**
   * Updates an existing role
   * Prevents updating system roles and validates uniqueness
   */
  async update(
    id: number,
    dto: {
      code?: string
      name?: string
    },
    updatedBy = 1
  ): Promise<typeof roles.$inferSelect> {
    // Check if role exists
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1)

    if (!role) {
      throw new NotFoundError(`Role with ID ${id} not found`, 'ROLE_NOT_FOUND')
    }

    // Prevent updating system roles
    if (role.isSystem) {
      throw new ConflictError('Cannot update system role', 'SYSTEM_ROLE_UPDATE_FORBIDDEN', { roleId: id })
    }

    // Check for uniqueness conflicts if code or name is being updated
    const conditions = []
    if (dto.code && dto.code !== role.code) {
      conditions.push(eq(roles.code, dto.code))
    }
    if (dto.name && dto.name !== role.name) {
      conditions.push(eq(roles.name, dto.name))
    }

    if (conditions.length > 0) {
      const existing = await db
        .select({ code: roles.code, name: roles.name })
        .from(roles)
        .where(or(...conditions))
        .limit(2)

      const codeConflict = dto.code && existing.some((r) => r.code === dto.code)
      const nameConflict = dto.name && existing.some((r) => r.name === dto.name)

      if (codeConflict && nameConflict) {
        throw new ConflictError('Role code and name already in use', 'ROLE_CODE_NAME_EXISTS', {
          code: dto.code,
          name: dto.name,
        })
      }

      if (codeConflict) {
        throw new ConflictError('Role code already in use', 'ROLE_CODE_EXISTS', { code: dto.code })
      }

      if (nameConflict) {
        throw new ConflictError('Role name already in use', 'ROLE_NAME_EXISTS', { name: dto.name })
      }
    }

    // Update role in a transaction
    const [updatedRole] = await db.transaction(async (tx) => {
      const updateData: Partial<typeof roles.$inferInsert> = {
        updatedBy,
      }

      if (dto.code) updateData.code = dto.code.toUpperCase().trim()
      if (dto.name) updateData.name = dto.name.trim()

      return tx.update(roles).set(updateData).where(eq(roles.id, id)).returning()
    })

    return updatedRole!
  }

  /**
   * Deletes a role permanently
   * Prevents deletion of system roles
   */
  async delete(id: number): Promise<void> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1)

    if (!role) {
      throw new NotFoundError(`Role with ID ${id} not found`, 'ROLE_NOT_FOUND')
    }

    // Prevent deletion of system roles
    if (role.isSystem) {
      throw new ConflictError('Cannot delete system role', 'SYSTEM_ROLE_DELETE_FORBIDDEN', { roleId: id })
    }

    await db.delete(roles).where(eq(roles.id, id))
  }
}
