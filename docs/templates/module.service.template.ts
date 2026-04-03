import { record } from '@elysiajs/opentelemetry'
import { and, eq, ilike } from 'drizzle-orm'

import { cache } from '@/core/cache'
import * as core from '@/core/database'
import { NotFoundError } from '@/core/http/errors'
import { db } from '@/db'
import { myEntityTable } from '@/db/schema' // Replace with your table

import { MyEntityDto, type MyEntityCreateDto, type MyEntityFilterDto, type MyEntityUpdateDto } from '../dto/my-entity.dto'

/**
 * Replace 'MyEntity' with your domain namespace (e.g. 'Location', 'MaterialCategory')
 */
export class MyEntityService {
  constructor(private readonly deps: { /* inject dependencies here */ }) {}

  async handleList(filter: MyEntityFilterDto) {
    return record('MyEntityService.handleList', async () => {
      const { search, limit, offset } = filter

      const conditions = []
      if (search) conditions.push(ilike(myEntityTable.name, `%${search}%`))

      const where = conditions.length > 0 ? and(...conditions) : undefined
      const rows = await db.select().from(myEntityTable).where(where).limit(limit).offset(offset)
      const total = await core.paginate.count(myEntityTable, where)

      return core.paginate.result(rows.map((row) => MyEntityDto.parse(row)), total, filter)
    })
  }

  async handleDetail(id: number) {
    return record('MyEntityService.handleDetail', async () => {
      const rows = await db.select().from(myEntityTable).where(eq(myEntityTable.id, id))
      const raw = core.takeFirstOrThrow(rows, `MyEntity ${id} not found`, 'MYENTITY_NOT_FOUND')
      return MyEntityDto.parse(raw)
    })
  }

  async handleCreate(data: MyEntityCreateDto, userId: number) {
    return record('MyEntityService.handleCreate', async () => {
      // 1. Conflict Check
      await core.checkConflict({
        table: myEntityTable,
        pkColumn: myEntityTable.id,
        fields: [{ column: myEntityTable.code, value: data.code, label: 'Code' }],
        input: data,
      })

      // 2. Insert
      const stamps = core.stamps.create(userId)
      const rows = await db.insert(myEntityTable).values({ ...data, ...stamps }).returning({ id: myEntityTable.id })
      
      return core.takeFirstOrThrow(rows)
    })
  }

  async handleUpdate(id: number, data: Omit<MyEntityUpdateDto, 'id'>, userId: number) {
    return record('MyEntityService.handleUpdate', async () => {
      const existing = await this.handleDetail(id)

      // 1. Conflict Check
      await core.checkConflict({
        table: myEntityTable,
        pkColumn: myEntityTable.id,
        fields: [{ column: myEntityTable.code, value: data.code, label: 'Code' }],
        input: data,
        existing,
      })

      // 2. Update
      const stamps = core.stamps.update(userId)
      const rows = await db
        .update(myEntityTable)
        .set({ ...data, ...stamps })
        .where(eq(myEntityTable.id, id))
        .returning({ id: myEntityTable.id })

      return core.takeFirstOrThrow(rows, `MyEntity ${id} not found on update`, 'MYENTITY_NOT_FOUND')
    })
  }

  async handleRemove(id: number, userId: number) {
    return record('MyEntityService.handleRemove', async () => {
      const stamps = core.stamps.remove(userId)
      const rows = await db
        .update(myEntityTable)
        .set(stamps)
        .where(eq(myEntityTable.id, id))
        .returning({ id: myEntityTable.id })

      return core.takeFirstOrThrow(rows, `MyEntity ${id} not found on remove`, 'MYENTITY_NOT_FOUND')
    })
  }
}
