import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull, or } from 'drizzle-orm'

import { cache } from '@/core/cache'
import * as core from '@/core/database'
import { db } from '@/db'
import { usersTable } from '@/db/schema'

import * as dto from '../dto/user.dto'
import type { UserAssignmentService } from './user-assignment.service'

const uniqueFields: core.ConflictField<'email' | 'username'>[] = [
  { field: 'email', column: usersTable.email, message: 'Email already exists', code: 'USER_EMAIL_ALREADY_EXISTS' },
  {
    field: 'username',
    column: usersTable.username,
    message: 'Username already exists',
    code: 'USER_USERNAME_ALREADY_EXISTS',
  },
]

const cacheKey = { count: 'iam.user.count', list: 'iam.user.list', byId: (id: number) => `iam.user.byId.${id}` }

// User Service (Layer 0)
// Handles sensitive identity and profile management.
export class UserService {
  constructor(private assignmentService: UserAssignmentService) {}

  // Seed initial users.
  async seed(data: (dto.UserCreateDto & { passwordHash: string; createdBy: number })[]): Promise<void> {
    await record('UserService.seed', async () => {
      for (const { assignments, ...d } of data) {
        const metadata = core.stampCreate(d.createdBy)
        await db.transaction(async (tx) => {
          const [inserted] = await tx
            .insert(usersTable)
            .values({ ...d, ...metadata })
            .onConflictDoUpdate({
              target: usersTable.username,
              set: {
                email: d.email,
                fullname: d.fullname,
                isActive: d.isActive,
                updatedAt: metadata.updatedAt,
                updatedBy: metadata.updatedBy,
                deletedAt: null,
              },
            })
            .returning({ id: usersTable.id })

          if (inserted && assignments && assignments.length > 0) {
            await this.assignmentService.handleUpsertBulk(inserted.id, assignments, d.createdBy)
          }
        })
      }
      await this.clearCache()
    })
  }

  // Returns active users.
  async find(): Promise<dto.UserDto[]> {
    const result = await record('UserService.find', async () => {
      const data = await cache.wrap(cacheKey.list, async () => {
        const rows = await db.select().from(usersTable).where(isNull(usersTable.deletedAt)).orderBy(usersTable.fullname)
        return rows.map((r) => dto.UserDto.parse(r))
      })
      return data
    })
    return result
  }

  // Finds a user by ID.
  async getById(id: number): Promise<dto.UserDto> {
    const result = await record('UserService.getById', async () => {
      const data = await cache.wrap(cacheKey.byId(id), async () => {
        const rows = await db
          .select()
          .from(usersTable)
          .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
        const first = core.takeFirstOrThrow(rows, `User with ID ${id} not found`, 'USER_NOT_FOUND')

        // Fetch assignments for detail view.
        const assignments = await this.assignmentService.findByUserId(id)
        return dto.UserDto.parse({ ...first, assignments })
      })
      return data
    })
    return result
  }

  // Returns total count.
  async count(): Promise<number> {
    const result = await record('UserService.count', async () => {
      const data = await cache.wrap(cacheKey.count, async () => {
        const rows = await db.select({ val: count() }).from(usersTable).where(isNull(usersTable.deletedAt))
        return rows[0]?.val ?? 0
      })
      return data
    })
    return result
  }

  // Paginated list.
  async handleList(filter: dto.UserFilterDto): Promise<core.WithPaginationResult<dto.UserDto>> {
    const result = await record('UserService.handleList', async () => {
      const { q, page, limit, isActive } = filter
      const where = and(
        isNull(usersTable.deletedAt),
        q === undefined
          ? undefined
          : or(
              core.searchFilter(usersTable.fullname, q),
              core.searchFilter(usersTable.username, q),
              core.searchFilter(usersTable.email, q),
            ),
        isActive === undefined ? undefined : eq(usersTable.isActive, isActive),
      )

      const p = await core.paginate<dto.UserDto>({
        data: async ({ limit: l, offset }) => {
          const rows = await db
            .select()
            .from(usersTable)
            .where(where)
            .orderBy(core.sortBy(usersTable.updatedAt, 'desc'))
            .limit(l)
            .offset(offset)
          return rows.map((r) => dto.UserDto.parse(r))
        },
        pq: { page, limit },
        countQuery: db.select({ count: count() }).from(usersTable).where(where),
      })
      return p
    })
    return result
  }

  // Finds a user by username or email.
  // Internal use for authentication.
  async findByIdentifier(identifier: string): Promise<(dto.UserDto & { passwordHash: string }) | null> {
    return record('UserService.findByIdentifier', async () => {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(
          and(isNull(usersTable.deletedAt), or(eq(usersTable.username, identifier), eq(usersTable.email, identifier))),
        )
        .limit(1)

      if (!user) return null
      return { ...dto.UserDto.parse(user), passwordHash: user.passwordHash }
    })
  }

  // Resource detail.
  async handleDetail(id: number): Promise<dto.UserDto> {
    return this.getById(id)
  }

  // Alias for detail retrieval, commonly used in Auth.
  async getDetailById(id: number): Promise<dto.UserDto> {
    return this.getById(id)
  }

  // Creation.
  async handleCreate(data: dto.UserCreateDto, actorId: number): Promise<{ id: number }> {
    const result = await record('UserService.handleCreate', async () => {
      await core.checkConflict({ table: usersTable, pkColumn: usersTable.id, fields: uniqueFields, input: data })

      const { assignments, password, ...rest } = data
      const passwordHash = await Bun.password.hash(password)

      const [inserted] = await db.transaction(async (tx) => {
        const [u] = await tx
          .insert(usersTable)
          .values({ ...rest, passwordHash, ...core.stampCreate(actorId) })
          .returning({ id: usersTable.id })

        if (u && assignments && assignments.length > 0) {
          await this.assignmentService.handleUpsertBulk(u.id, assignments, actorId)
        }
        return [u]
      })

      if (!inserted) throw new Error('Create failed')
      await this.clearCache()
      return inserted
    })
    return result
  }

  // Update.
  async handleUpdate(id: number, data: dto.UserUpdateDto, actorId: number): Promise<{ id: number }> {
    const result = await record('UserService.handleUpdate', async () => {
      const existing = await this.getById(id)
      await core.checkConflict({
        table: usersTable,
        pkColumn: usersTable.id,
        fields: uniqueFields,
        input: { ...data },
        existing,
      })

      const { assignments, password, ...rest } = data
      const passwordHash = password ? await Bun.password.hash(password) : undefined

      await db.transaction(async (tx) => {
        await tx
          .update(usersTable)
          .set({ ...rest, ...(passwordHash && { passwordHash }), ...core.stampUpdate(actorId) })
          .where(eq(usersTable.id, id))

        if (assignments) {
          await this.assignmentService.handleUpsertBulk(id, assignments, actorId)
        }
      })

      await this.clearCache(id)
      return { id }
    })
    return result
  }

  // Administrative password reset.
  async handleAdminUpdatePassword(data: dto.UserAdminUpdatePasswordDto, actorId: number): Promise<{ id: number }> {
    return record('UserService.handleAdminUpdatePassword', async () => {
      const { id, password } = data
      const passwordHash = await Bun.password.hash(password)

      await db
        .update(usersTable)
        .set({ passwordHash, ...core.stampUpdate(actorId) })
        .where(eq(usersTable.id, id))

      await this.clearCache(id)
      return { id }
    })
  }

  // Removal.
  async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
    return record('UserService.handleRemove', async () => {
      const [result] = await db
        .update(usersTable)
        .set({ deletedAt: new Date(), deletedBy: actorId })
        .where(eq(usersTable.id, id))
        .returning({ id: usersTable.id })
      if (!result) throw new Error('User not found')
      await this.clearCache(id)
      return result
    })
  }

  // Hard Removal.
  async handleHardRemove(id: number): Promise<{ id: number }> {
    return record('UserService.handleHardRemove', async () => {
      const [result] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id })
      if (!result) throw new Error('User not found')
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
