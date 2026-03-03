import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage } from 'mongoose'

import { cache } from '@/lib/cache'
import { checkConflict, PipelineBuilder, pipelineHelper, stampCreate, stampUpdate, type ConflictField } from '@/lib/db'
import { NotFoundError } from '@/lib/error/http'
import { toLookupMap } from '@/lib/utils/collection.util'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import { MaterialDto, type MaterialFilterDto, type MaterialMutationDto, type MaterialSelectDto } from '../dto'
import { MaterialModel } from '../model'

import type { MaterialCategoryService } from './material-category.service'

const err = {
  notFound: (id: ObjectId) => new NotFoundError(`Material with ID ${id} not found`),
}

const uniqueFields: ConflictField<Pick<MaterialMutationDto, 'sku' | 'name'>>[] = [
  { field: 'sku', message: 'Material SKU already exists', code: 'MATERIAL_SKU_ALREADY_EXISTS' },
  { field: 'name', message: 'Material name already exists', code: 'MATERIAL_NAME_ALREADY_EXISTS' },
]

const cacheKey = {
  count: 'material.count',
  list: 'material.list',
  byId: (id: ObjectId) => `material.byId.${id}`,
}

export class MaterialService {
  constructor(private readonly categorySvc: MaterialCategoryService) {}

  async find(): Promise<MaterialDto[]> {
    return record('MaterialService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return PipelineBuilder.create(MaterialModel).push(pipelineHelper.$setId()).exec({ schema: MaterialDto.array() })
      })
    })
  }

  async findById(id: ObjectId): Promise<MaterialDto> {
    return record('MaterialService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const result = await PipelineBuilder.create(MaterialModel)
          .push(pipelineHelper.$matchId(id), pipelineHelper.$setId())
          .execOne({ schema: MaterialDto })

        if (!result) throw err.notFound(id)
        return result
      })
    })
  }

  async count(): Promise<number> {
    return record('MaterialService.count', async () => {
      return MaterialModel.countDocuments()
    })
  }

  async handleList(filter: MaterialFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<MaterialSelectDto>> {
    return record('MaterialService.handleList', async () => {
      const { search, type, categoryId } = filter
      const $match: PipelineStage.Match['$match'] = {}

      if (search) $match.$text = { $search: search, $diacriticSensitive: true }
      if (typeof type === 'string') $match.type = type
      if (typeof categoryId === 'string') $match.categoryId = categoryId

      const pb = PipelineBuilder.create(MaterialModel)
      const pbWithFilter = Object.keys($match).length > 0 ? pb.push(pipelineHelper.$match($match)) : pb

      const { data: materials, meta } = await pbWithFilter.execPaginated({
        schema: MaterialDto.array(),
        pq,
        facetAfter: [pipelineHelper.$setId()],
      })

      const categoryMap = toLookupMap(await this.categorySvc.find(), 'id')

      const data: MaterialSelectDto[] = materials.map((m) => ({
        ...m,
        category: m.categoryId ? categoryMap.get(m.categoryId.toString())! : null,
      }))

      return { data, meta }
    })
  }

  async handleDetail(id: ObjectId): Promise<MaterialSelectDto> {
    return record('MaterialService.handleDetail', async () => {
      const material = await this.findById(id)
      const category = material.categoryId ? await this.categorySvc.findById(material.categoryId) : null
      return {
        ...material,
        category,
      }
    })
  }

  async handleCreate(data: MaterialMutationDto, actorId: ObjectId): Promise<{ id: ObjectId }> {
    return record('MaterialService.handleCreate', async () => {
      await checkConflict({ model: MaterialModel, fields: uniqueFields, input: { sku: data.sku, name: data.name } })

      const material = new MaterialModel({
        ...data,
        ...stampCreate(actorId),
      })

      await material.save()
      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id: material._id }
    })
  }

  async handleUpdate(id: ObjectId, data: MaterialMutationDto, actorId: ObjectId): Promise<{ id: ObjectId }> {
    return record('MaterialService.handleUpdate', async () => {
      const existing = await this.findById(id)
      await checkConflict({
        model: MaterialModel,
        fields: uniqueFields,
        input: { sku: data.sku, name: data.name },
        existing,
      })

      await MaterialModel.findByIdAndUpdate(id, {
        ...data,
        ...stampUpdate(actorId),
      })

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      void cache.del(cacheKey.byId(id))
      return { id }
    })
  }

  async handleRemove(id: ObjectId): Promise<{ id: ObjectId }> {
    return record('MaterialService.handleRemove', async () => {
      const result = await MaterialModel.findByIdAndDelete(id)
      if (!result) throw err.notFound(id)

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      void cache.del(cacheKey.byId(id))
      return { id }
    })
  }
}
