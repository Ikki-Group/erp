import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage } from 'mongoose'

import { cache } from '@/lib/cache'
import { PipelineBuilder, pipelineHelper } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/pagination'

import { MaterialCategoryDto, type MaterialCategoryFilterDto, type MaterialCategoryMutationDto } from '../dto'
import { MaterialCategoryModel } from '../model'

const err = {
  notFound: (id: ObjectId) =>
    new NotFoundError(`Material category with ID ${id} not found`, 'MATERIAL_CATEGORY_NOT_FOUND'),
  nameExist: (name: string) =>
    new ConflictError(`Material category name ${name} already exists`, 'MATERIAL_CATEGORY_NAME_ALREADY_EXISTS'),
}

const cacheKey = {
  count: 'materialCategory.count',
  list: 'materialCategory.list',
}

export class MaterialCategoryService {
  async #checkConflict(input: Pick<MaterialCategoryDto, 'name'>, existing?: MaterialCategoryDto): Promise<void> {
    return record('MaterialCategoryService.#checkConflict', async () => {
      const nameChanged = !existing || existing.name !== input.name

      if (!nameChanged) return

      const $or = [...(nameChanged ? [{ name: input.name.toUpperCase().trim() }] : [])]
      const conflict = await MaterialCategoryModel.findOne(existing ? { _id: { $ne: existing.id }, $or } : { $or })
        .select('name')
        .lean()

      if (!conflict) return
      if (nameChanged && conflict.name === input.name.toUpperCase().trim()) throw err.nameExist(input.name)
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

  async handleCreate(data: MaterialCategoryMutationDto): Promise<{ id: ObjectId }> {
    return record('MaterialCategoryService.handleCreate', async () => {
      await this.#checkConflict(data)

      const category = new MaterialCategoryModel({
        ...data,
      })

      category.createdBy = category._id
      category.updatedBy = category._id

      await category.save()
      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id: category._id }
    })
  }

  async handleUpdate(id: ObjectId, data: MaterialCategoryMutationDto): Promise<{ id: ObjectId }> {
    return record('MaterialCategoryService.handleUpdate', async () => {
      const existing = await this.findById(id)
      if (!existing) throw err.notFound(id)

      await this.#checkConflict(data, existing)
      await MaterialCategoryModel.findByIdAndUpdate(id, {
        ...data,
        updatedBy: id,
        updatedAt: new Date(),
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
