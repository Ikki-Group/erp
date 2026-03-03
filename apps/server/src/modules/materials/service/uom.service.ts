import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage } from 'mongoose'

import { cache } from '@/lib/cache'
import { checkConflict, PipelineBuilder, pipelineHelper, stampCreate, stampUpdate, type ConflictField } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import { UomDto, type UomFilterDto, type UomMutationDto } from '../dto'
import { UomModel } from '../model'

const err = {
  notFound: (id: ObjectId) => new NotFoundError(`UOM with ID ${id} not found`),
  conflict: (code: string) => new ConflictError(`UOM code ${code} already exists`),
}

const uniqueFields: ConflictField<Pick<UomMutationDto, 'code'>>[] = [
  { field: 'code', message: 'UOM code already exists', code: 'UOM_CODE_ALREADY_EXISTS' },
]

const cacheKey = {
  count: 'uom.count',
  list: 'uom.list',
}

export class UomService {
  async find(): Promise<UomDto[]> {
    return record('UomService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return PipelineBuilder.create(UomModel).push(pipelineHelper.$setId()).exec({ schema: UomDto.array() })
      })
    })
  }

  async findById(id: ObjectId): Promise<UomDto> {
    return record('UomService.findById', async () => {
      const result = await PipelineBuilder.create(UomModel)
        .push(pipelineHelper.$matchId(id), pipelineHelper.$setId())
        .execOne({ schema: UomDto })

      if (!result) throw err.notFound(id)
      return result
    })
  }

  async handleList(filter: UomFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<UomDto>> {
    return record('UomService.handleList', async () => {
      const { search } = filter
      const $match: PipelineStage.Match['$match'] = {}

      if (search) $match.$text = { $search: search, $diacriticSensitive: true }

      const pb = PipelineBuilder.create(UomModel)
      const pbWithFilter = Object.keys($match).length > 0 ? pb.push(pipelineHelper.$match($match)) : pb

      return pbWithFilter.execPaginated({
        schema: UomDto.array(),
        pq,
        facetAfter: [pipelineHelper.$setId()],
      })
    })
  }

  async handleDetail(id: ObjectId): Promise<UomDto> {
    return record('UomService.handleDetail', async () => {
      return this.findById(id)
    })
  }

  async handleCreate(data: UomMutationDto, actorId: ObjectId): Promise<{ id: ObjectId }> {
    return record('UomService.handleCreate', async () => {
      await checkConflict({ model: UomModel, fields: uniqueFields, input: { code: data.code } })

      const uom = new UomModel({
        ...data,
        ...stampCreate(actorId),
      })

      await uom.save()
      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id: uom._id }
    })
  }

  async handleUpdate(id: ObjectId, data: UomMutationDto, actorId: ObjectId): Promise<{ id: ObjectId }> {
    return record('UomService.handleUpdate', async () => {
      const existing = await this.findById(id)

      await checkConflict({ model: UomModel, fields: uniqueFields, input: { code: data.code }, existing })

      await UomModel.findByIdAndUpdate(id, {
        ...data,
        ...stampUpdate(actorId),
      })

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id }
    })
  }

  async handleRemove(id: ObjectId): Promise<{ id: ObjectId }> {
    return record('UomService.handleRemove', async () => {
      const result = await UomModel.findByIdAndDelete(id)
      if (!result) throw err.notFound(id)

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id }
    })
  }
}
