import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage } from 'mongoose'

import { cache } from '@/lib/cache'
import { checkConflict, PipelineBuilder, pipelineHelper, stampCreate, stampUpdate, type ConflictField } from '@/lib/db'
import { NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import { LocationDto, type LocationFilterDto, type LocationMutationDto } from '../dto'
import { LocationModel } from '../model'

const err = {
  notFound: (id: ObjectId) => new NotFoundError(`Location with ID ${id} not found`, 'LOCATION_NOT_FOUND'),
}

const uniqueFields: ConflictField<Pick<LocationMutationDto, 'code' | 'name'>>[] = [
  { field: 'code', message: 'Location code already exists', code: 'LOCATION_CODE_ALREADY_EXISTS' },
  { field: 'name', message: 'Location name already exists', code: 'LOCATION_NAME_ALREADY_EXISTS' },
]

const cacheKey = {
  count: 'location.count',
  list: 'location.list',
}

export class LocationService {
  async seed(data: Pick<LocationDto, 'id' | 'code' | 'name' | 'type' | 'createdBy'>[]): Promise<void> {
    return record('LocationService.seed', async () => {
      // Bulk upsert
      const locations: LocationDto[] = data.map((d) => ({
        ...d,
        description: '',
        isActive: true,
        ...stampCreate(d.createdBy),
      }))

      await LocationModel.bulkWrite(
        locations.map((l) => ({
          replaceOne: {
            filter: { code: l.code },
            replacement: l,
            upsert: true,
          },
        }))
      )
    })
  }

  async find(): Promise<LocationDto[]> {
    return record('LocationService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return PipelineBuilder.create(LocationModel).push(pipelineHelper.$setId()).exec({ schema: LocationDto.array() })
      })
    })
  }

  async findById(id: ObjectId): Promise<LocationDto> {
    return record('LocationService.findById', async () => {
      const result = await PipelineBuilder.create(LocationModel)
        .push(pipelineHelper.$matchId(id), pipelineHelper.$setId())
        .execOne({ schema: LocationDto })
      if (!result) throw err.notFound(id)
      return result
    })
  }

  async count(): Promise<number> {
    return record('LocationService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        return LocationModel.countDocuments()
      })
    })
  }

  async handleList(filter: LocationFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<LocationDto>> {
    return record('LocationService.handleList', async () => {
      const { search, type, isActive } = filter
      const $match: PipelineStage.Match['$match'] = {}

      if (search) $match.$text = { $search: search, $diacriticSensitive: true }
      if (typeof type === 'string') $match.type = type
      if (typeof isActive === 'boolean') $match.isActive = isActive

      const pb = PipelineBuilder.create(LocationModel)
      const pbWithFilter = Object.keys($match).length > 0 ? pb.push(pipelineHelper.$match($match)) : pb

      return pbWithFilter.execPaginated({
        schema: LocationDto.array(),
        pq,
        facetAfter: [pipelineHelper.$setId()],
      })
    })
  }

  async handleDetail(id: ObjectId): Promise<LocationDto> {
    return record('LocationService.handleDetail', async () => {
      return this.findById(id)
    })
  }

  async handleCreate(data: LocationMutationDto, actorId: ObjectId): Promise<{ id: ObjectId }> {
    return record('LocationService.handleCreate', async () => {
      await checkConflict({ model: LocationModel, fields: uniqueFields, input: data })

      const location = new LocationModel({
        ...data,
        ...stampCreate(actorId),
      })

      await location.save()
      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id: location._id }
    })
  }

  async handleUpdate(id: ObjectId, data: LocationMutationDto, actorId: ObjectId): Promise<{ id: ObjectId }> {
    return record('LocationService.handleUpdate', async () => {
      const { code, name } = data
      const existing = await this.findById(id)
      await checkConflict({ model: LocationModel, fields: uniqueFields, input: { code, name }, existing })

      await LocationModel.findByIdAndUpdate(id, {
        ...data,
        ...stampUpdate(actorId),
      })

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id }
    })
  }

  async handleRemove(id: ObjectId): Promise<{ id: ObjectId }> {
    return record('LocationService.handleRemove', async () => {
      const result = await LocationModel.findByIdAndDelete(id)
      if (!result) throw err.notFound(id)

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id }
    })
  }
}
