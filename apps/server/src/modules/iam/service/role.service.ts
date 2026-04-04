import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull, or } from 'drizzle-orm'

import { cache } from '@/core/cache'
import * as core from '@/core/database'
import { db } from '@/db'
import { rolesTable } from '@/db/schema'

import * as dto from '../dto/role.dto'

const uniqueFields: core.ConflictField<'code' | 'name'>[] = [
  { field: 'code', column: rolesTable.code, message: 'Role code already exists', code: 'ROLE_CODE_ALREADY_EXISTS' },
  { field: 'name', column: rolesTable.name, message: 'Role name already exists', code: 'ROLE_NAME_ALREADY_EXISTS' },
]

const cacheKey = { count: 'iam.role.count', list: 'iam.role.list', byId: (id: number) => `iam.role.byId.${id}` }

// Role Service (Layer 0)
// Handles authorization role definitions and permission sets.
export class RoleService {
  // Seed initial roles.
  async seed(data: (dto.RoleCreateDto & { createdBy: number })[]): Promise<void> {
    await record('RoleService.seed', async () => {
      for (const d of data) {
        const metadata = core.stampCreate(d.createdBy)
        await db
          .insert(rolesTable)
          .values({ ...d, ...metadata })
          .onConflictDoUpdate({
            target: rolesTable.code,
            set: {
              name: d.name,
              description: d.description,
              permissions: d.permissions,
              updatedAt: metadata.updatedAt,
              updatedBy: metadata.updatedBy,
              deletedAt: null,
            },
          })
      }
      await this.clearCache()
    })
  }

  // Returns active roles.
  async find(): Promise<dto.RoleDto[]> {
    const result = await record('RoleService.find', async () => {
      const data = await cache.wrap(cacheKey.list, async () => {
        const rows = await db.select().from(rolesTable).where(isNull(rolesTable.deletedAt)).orderBy(rolesTable.name)
        return rows.map((r) => dto.RoleDto.parse(r))
      })
      return data
    })
    return result
  }

  // Finds a role by ID.
  async getById(id: number): Promise<dto.RoleDto> {
    const result = await record('RoleService.getById', async () => {
      const data = await cache.wrap(cacheKey.byId(id), async () => {
        const rows = await db
          .select()
          .from(rolesTable)
          .where(and(eq(rolesTable.id, id), isNull(rolesTable.deletedAt)))
        const first = core.takeFirstOrThrow(rows, `Role with ID ${id} not found`, 'ROLE_NOT_FOUND')
        return dto.RoleDto.parse(first)
      })
      return data
    })
    return result
  }

  // Returns total count.
  async count(): Promise<number> {
    const result = await record('RoleService.count', async () => {
      const data = await cache.wrap(cacheKey.count, async () => {
        const rows = await db.select({ val: count() }).from(rolesTable).where(isNull(rolesTable.deletedAt))
        return rows[0]?.val ?? 0
      })
      return data
    })
    return result
  }

  // Paginated list.
  async handleList(filter: dto.RoleFilterDto): Promise<core.WithPaginationResult<dto.RoleDto>> {
    const result = await record('RoleService.handleList', async () => {
      const { q, page, limit } = filter
      const where = and(
        isNull(rolesTable.deletedAt),
        q === undefined ? undefined : or(core.searchFilter(rolesTable.name, q), core.searchFilter(rolesTable.code, q)),
      )

      const p = await core.paginate<dto.RoleDto>({
        data: async ({ limit: l, offset }) => {
          const rows = await db
            .select()
            .from(rolesTable)
            .where(where)
            .orderBy(core.sortBy(rolesTable.updatedAt, 'desc'))
            .limit(l)
            .offset(offset)
          return rows.map((r) => dto.RoleDto.parse(r))
        },
        pq: { page, limit },
        countQuery: db.select({ count: count() }).from(rolesTable).where(where),
      })
      return p
    })
    return result
  }

  // Resource detail.
  async handleDetail(id: number): Promise<dto.RoleDto> {
    return this.getById(id)
  }

  // Creation.
  async handleCreate(data: dto.RoleCreateDto, actorId: number): Promise<{ id: number }> {
    const result = await record('RoleService.handleCreate', async () => {
      await core.checkConflict({
        table: rolesTable,
        pkColumn: rolesTable.id,
        fields: uniqueFields,
        input: data as unknown as Record<string, unknown>,
      })
      const [inserted] = await db
        .insert(rolesTable)
        .values({ ...data, ...core.stampCreate(actorId) })
        .returning({ id: rolesTable.id })
      if (!inserted) throw new Error('Create failed')
      await this.clearCache()
      return inserted
    })
    return result
  }

  // Update.
  async handleUpdate(id: number, data: dto.RoleBaseDto, actorId: number): Promise<{ id: number }> {
    const result = await record('RoleService.handleUpdate', async () => {
      const existing = await this.getById(id)
      if (existing.isSystem) throw new Error('Cannot update system role')
      await core.checkConflict({
        table: rolesTable,
        pkColumn: rolesTable.id,
        fields: uniqueFields,
        input: { ...data, id } as unknown as Record<string, unknown>,
        existing,
      })
      await db
        .update(rolesTable)
        .set({ ...data, ...core.stampUpdate(actorId) })
        .where(eq(rolesTable.id, id))
      await this.clearCache(id)
      return { id }
    })
    return result
  }

  // Removal.
  async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
    return record('RoleService.handleRemove', async () => {
      const existing = await this.getById(id)
      if (existing.isSystem) throw new Error('Cannot remove system role')
      const [result] = await db
        .update(rolesTable)
        .set({ deletedAt: new Date(), deletedBy: actorId })
        .where(eq(rolesTable.id, id))
        .returning({ id: rolesTable.id })
      if (!result) throw new Error('Role not found')
      await this.clearCache(id)
      return result
    })
  }

  // Hard Removal.
  async handleHardRemove(id: number): Promise<{ id: number }> {
    return record('RoleService.handleHardRemove', async () => {
      const existing = await this.getById(id)
      if (existing.isSystem) throw new Error('Cannot remove system role')
      const [result] = await db.delete(rolesTable).where(eq(rolesTable.id, id)).returning({ id: rolesTable.id })
      if (!result) throw new Error('Role not found')
      await this.clearCache(id)
      return result
    })
  }

  // Clear relevant caches.
  private async clearCache(id?: number) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
    ])
  }
}
