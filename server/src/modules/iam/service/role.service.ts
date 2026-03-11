import { record } from '@elysiajs/opentelemetry'
import { count, eq } from 'drizzle-orm'

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

import { rolesTable } from '@/db/schema'

import { db } from '@/db'

import type { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: number) => new NotFoundError(`Role with ID ${id} not found`, 'ROLE_NOT_FOUND'),
  systemRole: () => new BadRequestError('Cannot mutate a system role', 'ROLE_IS_SYSTEM'),
}

const uniqueFields: ConflictField<'code' | 'name'>[] = [
  { field: 'code', column: rolesTable.code, message: 'Role code already exists', code: 'ROLE_CODE_ALREADY_EXISTS' },
  { field: 'name', column: rolesTable.name, message: 'Role name already exists', code: 'ROLE_NAME_ALREADY_EXISTS' },
]

const cacheKey = {
  count: 'role.count',
  list: 'role.list',
  byId: (id: number) => `role.byId.${id}`,
}

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
          .values({
            ...d,
            isSystem: true,
            ...metadata,
          })
          .onConflictDoUpdate({
            target: rolesTable.code,
            set: {
              name: d.name,
              updatedAt: metadata.updatedAt,
              updatedBy: metadata.updatedBy,
            },
          })
      }
      void this.clearCache()
    })
  }

  /**
   * Returns all roles, cached.
   */
  async find(): Promise<RoleDto[]> {
    return record('RoleService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return db.select().from(rolesTable).orderBy(rolesTable.name)
      })
    })
  }

  /**
   * Finds a single role by ID. Throws if not found.
   */
  async findById(id: number): Promise<RoleDto> {
    return record('RoleService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const result = await db.select().from(rolesTable).where(eq(rolesTable.id, id))
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
        const result = await db.select({ val: count() }).from(rolesTable)
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
      const where = searchFilter(rolesTable.name, search)

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
   * Serves role detail.
   */
  async handleDetail(id: number): Promise<RoleDto> {
    return this.findById(id)
  }

  /**
   * Creates a new role. Invalidates cache.
   */
  async handleCreate(data: RoleCreateDto, actorId: number): Promise<{ id: number }> {
    return record('RoleService.handleCreate', async () => {
      const code = data.code.toUpperCase().trim()
      const name = data.name.trim()

      await checkConflict({
        table: rolesTable,
        pkColumn: rolesTable.id,
        fields: uniqueFields,
        input: { code, name },
      })

      const [inserted] = await db
        .insert(rolesTable)
        .values({
          ...data,
          code,
          name,
          ...stampCreate(actorId),
        })
        .returning({ id: rolesTable.id })

      if (!inserted) throw new Error('Failed to create role')

      void this.clearCache()
      return inserted
    })
  }

  /**
   * Updates existing role. Invalidates cache.
   */
  async handleUpdate(id: number, data: RoleUpdateDto, actorId: number): Promise<{ id: number }> {
    return record('RoleService.handleUpdate', async () => {
      const existing = await this.findById(id)

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
        .set({
          ...data,
          code,
          name,
          ...stampUpdate(actorId),
        })
        .where(eq(rolesTable.id, id))

      void this.clearCache(id)
      return { id }
    })
  }

  /**
   * Removes role. Invalidates cache.
   */
  async handleRemove(id: number): Promise<{ id: number }> {
    return record('RoleService.handleRemove', async () => {
      const existing = await this.findById(id)
      if (existing.isSystem) throw err.systemRole()

      const result = await db.delete(rolesTable).where(eq(rolesTable.id, id)).returning({ id: rolesTable.id })
      if (result.length === 0) throw err.notFound(id)

      void this.clearCache(id)
      return { id }
    })
  }

  /**
   * Clears relevant role caches.
   */
  private async clearCache(id?: number) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
    ])
  }
}
