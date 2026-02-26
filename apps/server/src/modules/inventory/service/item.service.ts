import { and, count, eq, ilike, not, or } from 'drizzle-orm'

import { NotFoundError } from '@/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/pagination'

import { db } from '@/database'
import { items } from '@/database/schema'

import type { ItemCreateDto, ItemDto, ItemFilterDto, ItemUpdateDto } from '../dto'

const err = {
  notFound: (id: number) => new NotFoundError(`Item with ID ${id} not found`, 'ITEM_NOT_FOUND'),
  nameConflict: (name: string) => `Item name ${name} already exists`,
}

export class ItemService {
  #buildWhere(filter: ItemFilterDto) {
    const { search, type, categoryId } = filter
    const conditions = []

    if (search) {
      conditions.push(or(ilike(items.name, `%${search}%`), ilike(items.description, `%${search}%`)))
    }

    if (type) {
      conditions.push(eq(items.type, type))
    }

    if (categoryId !== undefined) {
      conditions.push(eq(items.categoryId, categoryId))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    return whereClause
  }

  async #checkConflict(name: string, selected?: ItemDto): Promise<void> {
    const excludeId = selected?.id
    const conditions = []

    if (!selected || selected.name !== name) {
      conditions.push(eq(items.name, name))
    }

    if (conditions.length === 0) return

    const where = excludeId ? and(or(...conditions), not(eq(items.id, excludeId))) : or(...conditions)
    const found = await db.select({ id: items.id, name: items.name }).from(items).where(where)

    if (found.length === 0) return

    const nameConflict = found.some((r) => r.name === name)
    if (nameConflict) throw err.nameConflict(name)
  }

  async count(filter: ItemFilterDto): Promise<number> {
    const where = this.#buildWhere(filter)
    const [result] = await db.select({ total: count() }).from(items).where(where)
    return result?.total ?? 0
  }

  async find(filter: ItemFilterDto): Promise<ItemDto[]> {
    const where = this.#buildWhere(filter)
    return db.select().from(items).where(where).orderBy(items.name)
  }

  async findPaginated(filter: ItemFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<ItemDto>> {
    const where = this.#buildWhere(filter)

    const query = db.select().from(items).where(where).orderBy(items.name).$dynamic()
    const [data, total] = await Promise.all([withPagination(query, pq).execute(), this.count(filter)])

    return {
      data,
      meta: calculatePaginationMeta(pq, total),
    }
  }

  async findById(id: number): Promise<ItemDto> {
    const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1)

    if (!item) throw err.notFound(id)
    return item
  }

  async create(input: ItemCreateDto, createdBy = 1): Promise<ItemDto> {
    await this.#checkConflict(input.name)

    const [item] = await db
      .insert(items)
      .values({
        ...input,
        createdBy,
        updatedBy: createdBy,
      })
      .returning()

    if (!item) throw new Error('Failed to create item')
    return item
  }

  async update(id: number, input: ItemUpdateDto, updatedBy = 1): Promise<ItemDto> {
    const selected = await this.findById(id)
    await this.#checkConflict(input.name, selected)

    const [item] = await db
      .update(items)
      .set({
        ...input,
        updatedBy,
      })
      .where(eq(items.id, id))
      .returning()

    if (!item) throw err.notFound(id)
    return item
  }

  async remove(id: number): Promise<void> {
    const item = await this.findById(id)
    if (!item) throw err.notFound(id)
    await db.delete(items).where(eq(items.id, id))
  }
}
