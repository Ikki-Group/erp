import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage } from 'mongoose'

import { cache } from '@/lib/cache'
import { checkConflict, PipelineBuilder, pipelineHelper, stampCreate, stampUpdate, type ConflictField } from '@/lib/db'
import { NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import { MaterialCategoryDto, type MaterialCategoryFilterDto, type MaterialCategoryMutationDto } from '../dto'
import { MaterialCategoryModel } from '../model'

const err = {
  notFound: (id: ObjectId) =>
    new NotFoundError(`Material category with ID ${id} not found`, 'MATERIAL_CATEGORY_NOT_FOUND'),
}

const uniqueFields: ConflictField<Pick<MaterialCategoryMutationDto, 'name'>>[] = [
  { field: 'name', message: 'Material category name already exists', code: 'MATERIAL_CATEGORY_NAME_ALREADY_EXISTS' },
]

const cacheKey = {
  count: 'materialCategory.count',
  list: 'materialCategory.list',
}

export class MaterialCategoryService {
  async find(): Promise<MaterialCategoryDto[]> {
    return record('MaterialCategoryService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return PipelineBuilder.create(MaterialCategoryModel)
          .push(pipelineHelper.$setId())
          .exec({ schema: MaterialCategoryDto.array() })
      })
    })
  }

  async findById(id: ObjectId): Promise<MaterialCategoryDto> {
    return record('MaterialCategoryService.findById', async () => {
      const result = await PipelineBuilder.create(MaterialCategoryModel)
        .push(pipelineHelper.$matchId(id), pipelineHelper.$setId())
        .execOne({ schema: MaterialCategoryDto })

      if (!result) throw err.notFound(id)
      return result
    })
  }

  async count(): Promise<number> {
    return record('MaterialCategoryService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        return MaterialCategoryModel.countDocuments()
      })
    })
  }

  async handleList(
    filter: MaterialCategoryFilterDto,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<MaterialCategoryDto>> {
    return record('MaterialCategoryService.handleList', async () => {
      const { search } = filter
      const $match: PipelineStage.Match['$match'] = {}

      if (search) $match.$text = { $search: search, $diacriticSensitive: true }

      const pb = PipelineBuilder.create(MaterialCategoryModel)
      const pbWithFilter = Object.keys($match).length > 0 ? pb.push(pipelineHelper.$match($match)) : pb

      return pbWithFilter.execPaginated({
        schema: MaterialCategoryDto.array(),
        pq,
        facetAfter: [pipelineHelper.$setId()],
      })
    })
  }

  async handleDetail(id: ObjectId): Promise<MaterialCategoryDto> {
    return record('MaterialCategoryService.handleDetail', async () => {
      return this.findById(id)
    })
  }

  async handleCreate(data: MaterialCategoryMutationDto, actorId: ObjectId): Promise<{ id: ObjectId }> {
    return record('MaterialCategoryService.handleCreate', async () => {
      await checkConflict({ model: MaterialCategoryModel, fields: uniqueFields, input: { name: data.name } })

      const category = new MaterialCategoryModel({
        ...data,
        ...stampCreate(actorId),
      })

      await category.save()
      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id: category._id }
    })
  }

  async handleUpdate(id: ObjectId, data: MaterialCategoryMutationDto, actorId: ObjectId): Promise<{ id: ObjectId }> {
    return record('MaterialCategoryService.handleUpdate', async () => {
      const existing = await this.findById(id)
      if (!existing) throw err.notFound(id)

      await checkConflict({ model: MaterialCategoryModel, fields: uniqueFields, input: { name: data.name }, existing })
      await MaterialCategoryModel.findByIdAndUpdate(id, {
        ...data,
        ...stampUpdate(actorId),
      })

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id }
    })
  }

  async handleRemove(id: ObjectId): Promise<{ id: ObjectId }> {
    return record('MaterialCategoryService.handleRemove', async () => {
      const result = await MaterialCategoryModel.findByIdAndDelete(id)
      if (!result) throw err.notFound(id)

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id }
    })
  }
}
