import { and, count, eq, ilike, not, or } from 'drizzle-orm'

import { ConflictError, InternalServerError, NotFoundError } from '@/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/pagination'

import { db } from '@/database'
import { materialTable } from '@/database/schema'

import type { MaterialCreateDto, MaterialDto, MaterialFilterDto, MaterialUpdateDto } from '../dto'

import type { MaterialUomService } from './material-uom.service'

const err = {
  notFound: (id: number) => new NotFoundError(`Material with ID ${id} not found`),
  conflict: (sku: string) => new ConflictError(`Material with SKU ${sku} already exists`),
}

export class MaterialService {
  constructor(private readonly materialUom: MaterialUomService) {}

  #buildWhere(filter: MaterialFilterDto) {
    const { search } = filter
    const conditions = []

    if (search) {
      conditions.push(ilike(materialTable.sku, `%${search}%`))
    }

    return conditions.length > 0 ? and(...conditions) : undefined
  }

  async #checkConflict(data: Pick<MaterialDto, 'sku'>, selected?: MaterialDto): Promise<void> {
    const conditions = []

    if (!selected || selected.sku !== data.sku) {
      conditions.push(eq(materialTable.sku, data.sku))
    }

    if (conditions.length === 0) return

    const whereClause = selected ? and(or(...conditions), not(eq(materialTable.sku, selected.sku))) : or(...conditions)
    const existing = await db.select({ sku: materialTable.sku }).from(materialTable).where(whereClause).limit(1)

    if (existing.length === 0) return
    throw err.conflict(data.sku)
  }

  async count(filter?: MaterialFilterDto): Promise<number> {
    const qry = db.select({ total: count() }).from(materialTable).$dynamic()
    if (filter) qry.where(this.#buildWhere(filter))
    const [result] = await qry.execute()
    return result?.total ?? 0
  }

  async find(filter: MaterialFilterDto): Promise<MaterialDto[]> {
    const where = this.#buildWhere(filter)
    return db.select().from(materialTable).where(where).orderBy(materialTable.sku)
  }

  async findPaginated(filter: MaterialFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<MaterialDto>> {
    const where = this.#buildWhere(filter)

    const query = db.select().from(materialTable).where(where).orderBy(materialTable.sku).$dynamic()
    const [data, total] = await Promise.all([withPagination(query, pq).execute(), this.count(filter)])

    return {
      data,
      meta: calculatePaginationMeta(pq, total),
    }
  }

  async findById(id: number): Promise<MaterialDto> {
    const [material] = await db.select().from(materialTable).where(eq(materialTable.id, id)).limit(1)

    if (!material) throw err.notFound(id)
    return material
  }

  async create(data: MaterialCreateDto, createdBy = 1): Promise<MaterialDto> {
    await this.#checkConflict(data)

    const material = await db.transaction(async (tx) => {
      const [material] = await tx
        .insert(materialTable)
        .values({
          ...data,
          createdBy,
          updatedBy: createdBy,
        })
        .returning()

      if (!material) throw new InternalServerError('Failed to create material')

      await this.materialUom.bulkUpsert(material.id, data.conversions, tx)
      return material
    })

    return material
  }

  async update(data: MaterialUpdateDto, updatedBy = 1): Promise<MaterialDto> {
    const material = await this.findById(data.id)
    await this.#checkConflict(data, material)

    const updatedMaterial = await db.transaction(async (tx) => {
      const [updatedMaterial] = await tx
        .update(materialTable)
        .set({
          ...data,
          updatedBy,
        })
        .where(eq(materialTable.id, data.id))
        .returning()

      if (!updatedMaterial) throw err.notFound(data.id)
      await this.materialUom.bulkUpsert(updatedMaterial.id, data.conversions, tx)

      return updatedMaterial
    })

    if (!updatedMaterial) throw err.notFound(data.id)
    return updatedMaterial
  }

  async remove(id: number): Promise<void> {
    await this.findById(id)
    await db.delete(materialTable).where(eq(materialTable.id, id))
  }
}
