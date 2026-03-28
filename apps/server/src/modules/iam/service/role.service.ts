import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'

import { cache } from '@/core/cache'
import {
  checkConflict,
  paginate,
  searchFilter,
  sortBy,
  stampCreate,
  stampUpdate,
  takeFirstOrThrow,
  type ConflictField,
} from '@/core/database'
import { BadRequestError, NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'
import { db } from '@/db'
import { rolesTable } from '@/db/schema'

import type { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: string) => new NotFoundError(`Role with ID ${id} not found`, 'ROLE_NOT_FOUND'),
  systemRole: () => new BadRequestError('Cannot mutate a system role', 'ROLE_IS_SYSTEM'),
}

const uniqueFields: ConflictField<'code' | 'name'>[] = [
  { field: 'code', column: rolesTable.code, message: 'Role code already exists', code: 'ROLE_CODE_ALREADY_EXISTS' },
  { field: 'name', column: rolesTable.name, message: 'Role name already exists', code: 'ROLE_NAME_ALREADY_EXISTS' },
]

const cacheKey = { count: 'role.count', list: 'role.list', byId: (id: string) => `role.byId.${id}` }

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class RoleService {
  /**
   * Seed roles.
   */
  async seed(data: Pick<RoleDto, 'code' | 'name' | 'createdBy' | 'description'>[]): Promise<void> {
    return record('RoleService.seed', async () => {
      for (const d of data) {
        const metadata = stampCreate(d.createdBy)
        await db
          .insert(rolesTable)
          .values({ ...d, permissions: [], isSystem: true, ...metadata })
          .onConflictDoUpdate({
            target: rolesTable.code,
            set: { name: d.name, updatedAt: metadata.updatedAt, updatedBy: metadata.updatedBy },
          })
      }
      await this.clearCache()
    })
  }

  /**
   * Returns all roles, cached.
   * Excludes soft-deleted records.
   */
  async find(): Promise<RoleDto[]> {
    return record('RoleService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return db.select().from(rolesTable).where(isNull(rolesTable.deletedAt)).orderBy(rolesTable.name)
      })
    })
  }

  /**
   * Finds a single role by ID. Throws if not found or soft-deleted.
   */
  async getById(id: string): Promise<RoleDto> {
    return record('RoleService.getById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const result = await db
          .select()
          .from(rolesTable)
          .where(and(eq(rolesTable.id, id), isNull(rolesTable.deletedAt)))
        return takeFirstOrThrow(result, `Role with ID ${id} not found`, 'ROLE_NOT_FOUND')
      })
    })
  }

  /**
   * Returns total count of roles, cached.
   */
  async count(): Promise<number> {
    return record('RoleService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        const result = await db.select({ val: count() }).from(rolesTable).where(isNull(rolesTable.deletedAt))
        return result[0]?.val ?? 0
      })
    })
  }

  /**
   * Fetches paginated list of roles.
   */
  async handleList(filter: RoleFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<RoleDto>> {
    return record('RoleService.handleList', async () => {
      const { search } = filter
      const where = and(isNull(rolesTable.deletedAt), searchFilter(rolesTable.name, search))

      return paginate<RoleDto>({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(rolesTable)
            .where(where)
            .orderBy(sortBy(rolesTable.updatedAt, 'desc'))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(rolesTable).where(where),
      })
    })
  }

  /**
   * Creates a new role. Invalidates cache.
   */
  async handleCreate(data: RoleCreateDto, actorId: string): Promise<{ id: string }> {
    return record('RoleService.handleCreate', async () => {
      const code = data.code.toUpperCase().trim()
      const name = data.name.trim()

      await checkConflict({ table: rolesTable, pkColumn: rolesTable.id, fields: uniqueFields, input: { code, name } })

      const [inserted] = await db
        .insert(rolesTable)
        .values({ ...data, code, name, ...stampCreate(actorId) })
        .returning({ id: rolesTable.id })

      if (!inserted) throw new Error('Failed to create role')

      await this.clearCache()
      return inserted
    })
  }

  /**
   * Updates existing role. Invalidates cache.
   */
  async handleUpdate(id: string, data: RoleUpdateDto, actorId: string): Promise<{ id: string }> {
    return record('RoleService.handleUpdate', async () => {
      const existing = await this.getById(id)

      if (existing.isSystem) throw err.systemRole()

      const code = data.code ? data.code.toUpperCase().trim() : existing.code
      const name = data.name ? data.name.trim() : existing.name

      await checkConflict({
        table: rolesTable,
        pkColumn: rolesTable.id,
        fields: uniqueFields,
        input: { code, name },
        existing,
      })

      await db
        .update(rolesTable)
        .set({ ...data, code, name, ...stampUpdate(actorId) })
        .where(eq(rolesTable.id, id))

      await this.clearCache(id)
      return { id }
    })
  }

  /**
   * Serves role detail.
   */
  async handleDetail(id: string): Promise<RoleDto> {
    return record('RoleService.handleDetail', async () => {
      return this.getById(id)
    })
  }

  /**
   * Marks a role as deleted (Soft Delete).
   * Used for crucial entities like Roles.
   */
  async handleRemove(id: string, actorId: string): Promise<{ id: string }> {
    return record('RoleService.handleRemove', async () => {
      const existing = await this.getById(id)
      if (existing.isSystem) throw err.systemRole()

      const result = await db
        .update(rolesTable)
        .set({ deletedAt: new Date(), deletedBy: actorId })
        .where(eq(rolesTable.id, id))
        .returning({ id: rolesTable.id })

      if (result.length === 0) throw err.notFound(id)

      await this.clearCache(id)
      return { id }
    })
  }

  /**
   * Permanently deletes a role (Hard Delete).
   * USE WITH CAUTION.
   */
  async handleHardRemove(id: string): Promise<{ id: string }> {
    return record('RoleService.handleHardRemove', async () => {
      const existing = await this.getById(id)
      if (existing.isSystem) throw err.systemRole()

      const result = await db.delete(rolesTable).where(eq(rolesTable.id, id)).returning({ id: rolesTable.id })
      if (result.length === 0) throw err.notFound(id)

      await this.clearCache(id)
      return { id }
    })
  }

  /**
   * Clears relevant role caches.
   */
  private async clearCache(id?: string) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
    ])
  }
}
