import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage } from 'mongoose'

import { cache } from '@/lib/cache'
import { PipelineBuilder, pipelineHelper, stampCreate, stampUpdate } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import { MaterialDto, type MaterialFilterDto, type MaterialMutationDto } from '../dto'
import { MaterialModel } from '../model'

const err = {
  notFound: (id: ObjectId) => new NotFoundError(`Material with ID ${id} not found`),
  skuExist: (sku: string) => new ConflictError(`Material SKU ${sku} already exists`),
  nameExist: (name: string) => new ConflictError(`Material name ${name} already exists`),
}

const cacheKey = {
  count: 'material.count',
  list: 'material.list',
}

export class MaterialService {
  async #checkConflict(input: Pick<MaterialDto, 'sku' | 'name'>, existing?: MaterialDto): Promise<void> {
    return record('MaterialService.#checkConflict', async () => {
      const skuChanged = !existing || existing.sku !== input.sku
      const nameChanged = !existing || existing.name !== input.name

      if (!skuChanged && !nameChanged) return

      const $or = [
        ...(skuChanged ? [{ sku: input.sku.toUpperCase().trim() }] : []),
        ...(nameChanged ? [{ name: input.name.trim() }] : []),
      ]
      const conflict = await MaterialModel.findOne(existing ? { _id: { $ne: existing.id }, $or } : { $or })
        .select('sku name')
        .lean()

      if (!conflict) return
      if (skuChanged && conflict.sku === input.sku.toUpperCase().trim()) throw err.skuExist(input.sku)
      if (nameChanged && conflict.name === input.name.trim()) throw err.nameExist(input.name)
    })
  }

  async find(): Promise<MaterialDto[]> {
    return record('MaterialService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return PipelineBuilder.create(MaterialModel).push(pipelineHelper.$setId()).exec({ schema: MaterialDto.array() })
      })
    })
  }

  async findById(id: ObjectId): Promise<MaterialDto> {
    return record('MaterialService.findById', async () => {
      const result = await PipelineBuilder.create(MaterialModel)
        .push(pipelineHelper.$matchId(id), pipelineHelper.$setId())
        .execOne({ schema: MaterialDto })

      if (!result) throw err.notFound(id)
      return result
    })
  }

  async count(): Promise<number> {
    return record('MaterialService.count', async () => {
      return MaterialModel.countDocuments()
    })
  }

  async handleList(filter: MaterialFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<MaterialDto>> {
    return record('MaterialService.handleList', async () => {
      const { search, type, categoryId } = filter
      const $match: PipelineStage.Match['$match'] = {}

      if (search) $match.$text = { $search: search, $diacriticSensitive: true }
      if (typeof type === 'string') $match.type = type
      if (typeof categoryId === 'string') $match.categoryId = categoryId

      const pb = PipelineBuilder.create(MaterialModel)
      const pbWithFilter = Object.keys($match).length > 0 ? pb.push(pipelineHelper.$match($match)) : pb

      return pbWithFilter.execPaginated({
        schema: MaterialDto.array(),
        pq,
        facetAfter: [pipelineHelper.$setId()],
      })
    })
  }

  async handleDetail(id: ObjectId): Promise<MaterialDto> {
    return record('MaterialService.handleDetail', async () => {
      return this.findById(id)
    })
  }

  async handleCreate(data: MaterialMutationDto, actorId: ObjectId): Promise<{ id: ObjectId }> {
    return record('MaterialService.handleCreate', async () => {
      await this.#checkConflict(data)

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
      await this.#checkConflict(data, existing)

      await MaterialModel.findByIdAndUpdate(id, {
        ...data,
        ...stampUpdate(actorId),
      })

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id }
    })
  }

  async handleRemove(id: ObjectId): Promise<{ id: ObjectId }> {
    return record('MaterialService.handleRemove', async () => {
      const result = await MaterialModel.findByIdAndDelete(id)
      if (!result) throw err.notFound(id)

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id }
    })
  }
}
