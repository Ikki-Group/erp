import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, exists, ilike, inArray, notExists, or } from 'drizzle-orm'

import { cache } from '@/core/cache'
import { checkConflict, paginate, sortBy, stampCreate, stampUpdate, type ConflictField } from '@/core/database'
import { NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'
import { db } from '@/db'
import { materialConversionsTable, materialLocationsTable, materialsTable, uomsTable } from '@/db/schema'
import type { LocationService } from '@/modules/location/service/location.service'

import type {
  MaterialCategoryDto,
  MaterialDto,
  MaterialFilterDto,
  MaterialMutationDto,
  MaterialSelectDto,
  UomDto,
} from '../dto'
import type { MaterialCategoryService } from './material-category.service'
import type { UomService } from './uom.service'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = { notFound: (id: number) => new NotFoundError(`Material with ID ${id} not found`, 'MATERIAL_NOT_FOUND') }

const uniqueFields: ConflictField<'sku' | 'name'>[] = [
  {
    field: 'sku',
    column: materialsTable.sku,
    message: 'Material SKU already exists',
    code: 'MATERIAL_SKU_ALREADY_EXISTS',
  },
  {
    field: 'name',
    column: materialsTable.name,
    message: 'Material name already exists',
    code: 'MATERIAL_NAME_ALREADY_EXISTS',
  },
]

const cacheKey = { count: 'material.count', list: 'material.list', byId: (id: number) => `material.byId.${id}` }

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class MaterialService {
  constructor(
    private readonly categorySvc: MaterialCategoryService,
    private readonly uomSvc: UomService,
    private readonly locationSvc: LocationService,
  ) {}

  /**
   * Helper to fetch full material detail including conversions and locationIds
   */
  private async getMaterialWithRelations(id: number): Promise<MaterialDto> {
    const [result] = await db.select().from(materialsTable).where(eq(materialsTable.id, id)).limit(1)

    if (!result) throw err.notFound(id)

    const [conversions, locations] = await Promise.all([
      db
        .select({
          toBaseFactor: materialConversionsTable.toBaseFactor,
          uomId: materialConversionsTable.uomId,
          uom: uomsTable,
        })
        .from(materialConversionsTable)
        .innerJoin(uomsTable, eq(materialConversionsTable.uomId, uomsTable.id))
        .where(eq(materialConversionsTable.materialId, id)),

      db
        .select({ locationId: materialLocationsTable.locationId })
        .from(materialLocationsTable)
        .where(eq(materialLocationsTable.materialId, id)),
    ])

    return { ...result, conversions, locationIds: locations.map((l) => l.locationId) }
  }

  /**
   * Batch fetch full material details including conversions and locationIds
   */
  private async getMaterialsBatchWithRelations(
    ids: number[],
  ): Promise<Map<number, { conversions: MaterialDto['conversions']; locationIds: number[] }>> {
    if (ids.length === 0) return new Map<number, { conversions: MaterialDto['conversions']; locationIds: number[] }>()

    const [conversions, locations] = await Promise.all([
      db
        .select({
          materialId: materialConversionsTable.materialId,
          toBaseFactor: materialConversionsTable.toBaseFactor,
          uomId: materialConversionsTable.uomId,
          uom: uomsTable,
        })
        .from(materialConversionsTable)
        .innerJoin(uomsTable, eq(materialConversionsTable.uomId, uomsTable.id))
        .where(inArray(materialConversionsTable.materialId, ids)),

      db
        .select({ materialId: materialLocationsTable.materialId, locationId: materialLocationsTable.locationId })
        .from(materialLocationsTable)
        .where(inArray(materialLocationsTable.materialId, ids)),
    ])

    const map = new Map<number, { conversions: MaterialDto['conversions']; locationIds: number[] }>()
    for (const id of ids) {
      map.set(id, { conversions: [], locationIds: [] })
    }

    for (const c of conversions) {
      map.get(c.materialId)!.conversions.push({ toBaseFactor: c.toBaseFactor, uomId: c.uomId, uom: c.uom })
    }

    for (const l of locations) {
      map.get(l.materialId)!.locationIds.push(l.locationId)
    }

    return map
  }

  async find(): Promise<MaterialDto[]> {
    return record('MaterialService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        const rawMaterials = await db.select().from(materialsTable).orderBy(materialsTable.name)
        const relationsMap = await this.getMaterialsBatchWithRelations(rawMaterials.map((m) => m.id))

        return rawMaterials.map((m) => Object.assign({}, m, {
          conversions: relationsMap.get(m.id)!.conversions,
          locationIds: relationsMap.get(m.id)!.locationIds,
        }))
      })
    })
  }

  async findById(id: number): Promise<MaterialDto> {
    return record('MaterialService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        return this.getMaterialWithRelations(id)
      })
    })
  }

  async count(): Promise<number> {
    return record('MaterialService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        const result = await db.select({ val: count() }).from(materialsTable)
        return result[0]?.val ?? 0
      })
    })
  }

  async handleList(filter: MaterialFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<MaterialSelectDto>> {
    return record('MaterialService.handleList', async () => {
      const { search, type, categoryId, locationIds, excludeLocationIds } = filter

      const searchCondition = search
        ? or(ilike(materialsTable.name, `%${search}%`), ilike(materialsTable.sku, `%${search}%`))
        : undefined

      const locationCondition = locationIds?.length
        ? exists(
            db
              .select()
              .from(materialLocationsTable)
              .where(
                and(
                  eq(materialLocationsTable.materialId, materialsTable.id),
                  inArray(materialLocationsTable.locationId, locationIds),
                ),
              ),
          )
        : undefined

      const excludeLocationCondition = excludeLocationIds?.length
        ? notExists(
            db
              .select()
              .from(materialLocationsTable)
              .where(
                and(
                  eq(materialLocationsTable.materialId, materialsTable.id),
                  inArray(materialLocationsTable.locationId, excludeLocationIds),
                ),
              ),
          )
        : undefined

      const where = and(
        searchCondition,
        type ? eq(materialsTable.type, type) : undefined,
        categoryId === undefined ? undefined : eq(materialsTable.categoryId, categoryId),
        locationCondition,
        excludeLocationCondition,
      )

      const result = await paginate({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(materialsTable)
            .where(where)
            .orderBy(sortBy(materialsTable.updatedAt, 'desc'))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(materialsTable).where(where),
      })

      const materialIds = result.data.map((m) => m.id)
      const relationsMap = await this.getMaterialsBatchWithRelations(materialIds)

      const categoriesMap = new Map<number, MaterialCategoryDto>()
      const uomsMap = new Map<number, UomDto>()
      const [allCategories, allUoms] = await Promise.all([this.categorySvc.find(), this.uomSvc.find()])

      for (const cat of allCategories) {
        categoriesMap.set(cat.id, cat)
      }
      for (const uom of allUoms) {
        uomsMap.set(uom.id, uom)
      }

      const data: MaterialSelectDto[] = result.data.map((m) => ({
        ...m,
        conversions: relationsMap.get(m.id)!.conversions,
        locationIds: relationsMap.get(m.id)!.locationIds,
        category: m.categoryId ? (categoriesMap.get(m.categoryId) ?? null) : null,
        uom: uomsMap.get(m.baseUomId) ?? null,
      }))

      return { data, meta: result.meta }
    })
  }

  async handleDetail(id: number): Promise<MaterialSelectDto> {
    return record('MaterialService.handleDetail', async () => {
      const material = await this.findById(id)
      const [category, uom, locations] = await Promise.all([
        material.categoryId ? this.categorySvc.findById(material.categoryId) : null,
        this.uomSvc.findById(material.baseUomId).catch(() => null),
        material.locationIds.length > 0
          ? Promise.all(material.locationIds.map((lId) => this.locationSvc.findById(lId)))
          : [],
      ])

      return { ...material, category, uom, locations }
    })
  }

  async handleCreate(data: MaterialMutationDto, actorId: number): Promise<{ id: number }> {
    return record('MaterialService.handleCreate', async () => {
      const sku = data.sku.trim()
      const name = data.name.trim()

      await checkConflict({
        table: materialsTable,
        pkColumn: materialsTable.id,
        fields: uniqueFields,
        input: { sku, name },
      })

      const metadata = stampCreate(actorId)

      const inserted = await db.transaction(async (tx) => {
        const [material] = await tx
          .insert(materialsTable)
          .values({ ...data, sku, name, ...metadata })
          .returning({ id: materialsTable.id })

        if (material && data.conversions?.length > 0) {
          await tx
            .insert(materialConversionsTable)
            .values(
              data.conversions.map((c) => ({
                materialId: material.id,
                uomId: c.uomId,
                toBaseFactor: c.toBaseFactor,
                ...metadata,
              })),
            )
        }

        return material
      })

      if (!inserted) throw new Error('Failed to create material')

      void this.clearCache()
      return inserted
    })
  }

  async handleUpdate(id: number, data: MaterialMutationDto, actorId: number): Promise<{ id: number }> {
    return record('MaterialService.handleUpdate', async () => {
      const existing = await this.findById(id)

      const sku = data.sku ? data.sku.trim() : existing.sku
      const name = data.name ? data.name.trim() : existing.name

      await checkConflict({
        table: materialsTable,
        pkColumn: materialsTable.id,
        fields: uniqueFields,
        input: { sku, name },
        existing,
      })

      const updateMetadata = stampUpdate(actorId)
      const createMetadata = stampCreate(actorId)

      await db.transaction(async (tx) => {
        await tx
          .update(materialsTable)
          .set({ ...data, sku, name, ...updateMetadata })
          .where(eq(materialsTable.id, id))

        if (data.conversions !== undefined) {
          await tx.delete(materialConversionsTable).where(eq(materialConversionsTable.materialId, id))
          if (data.conversions.length > 0) {
            await tx
              .insert(materialConversionsTable)
              .values(
                data.conversions.map((c) => ({
                  materialId: id,
                  uomId: c.uomId,
                  toBaseFactor: c.toBaseFactor,
                  ...createMetadata,
                })),
              )
          }
        }
      })

      void this.clearCache(id)
      return { id }
    })
  }

  async handleRemove(id: number): Promise<{ id: number }> {
    return record('MaterialService.handleRemove', async () => {
      const result = await db
        .delete(materialsTable)
        .where(eq(materialsTable.id, id))
        .returning({ id: materialsTable.id })
      if (result.length === 0) throw err.notFound(id)

      void this.clearCache(id)
      return { id }
    })
  }

  /**
   * Clears relevant material caches.
   */
  private async clearCache(id?: number) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
    ])
  }
}
