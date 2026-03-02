import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage } from 'mongoose'

import { PipelineBuilder, pipelineHelper } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/pagination'

import { LocationDto, type LocationFilterDto, type LocationMutationDto } from '../dto'
import { LocationModel } from '../model'

const err = {
  notFound: (id: ObjectId) => new NotFoundError(`Location with ID ${id} not found`, 'LOCATION_NOT_FOUND'),
  codeExist: (code: string) =>
    new ConflictError(`Location code ${code} already exists`, 'LOCATION_CODE_ALREADY_EXISTS'),
  nameExist: (name: string) =>
    new ConflictError(`Location name ${name} already exists`, 'LOCATION_NAME_ALREADY_EXISTS'),
}

export class LocationService {
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
      return LocationModel.countDocuments()
    })
  }

  async #checkConflict(input: Pick<LocationMutationDto, 'code' | 'name'>, existing?: LocationDto): Promise<void> {
    const codeChanged = !existing || existing.code !== input.code
    const nameChanged = !existing || existing.name !== input.name

    if (!codeChanged && !nameChanged) return

    const $or = [...(codeChanged ? [{ code: input.code }] : []), ...(nameChanged ? [{ name: input.name }] : [])]

    const conflict = await LocationModel.findOne(existing ? { _id: { $ne: existing.id }, $or } : { $or })
      .select('code name')
      .lean()

    if (!conflict) return
    if (codeChanged && conflict.code === input.code) throw err.codeExist(input.code)
    if (nameChanged && conflict.name === input.name) throw err.nameExist(input.name)
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

  async handleCreate(data: LocationMutationDto): Promise<{ id: ObjectId }> {
    return record('LocationService.handleCreate', async () => {
      await this.#checkConflict(data)

      const location = new LocationModel({
        ...data,
      })

      location.createdBy = location._id
      location.updatedBy = location._id

      await location.save()
      return { id: location._id }
    })
  }

  async handleUpdate(id: ObjectId, data: LocationMutationDto): Promise<{ id: ObjectId }> {
    return record('LocationService.handleUpdate', async () => {
      const { code, name } = data
      const existing = await this.findById(id)
      await this.#checkConflict({ code, name }, existing)

      await LocationModel.findByIdAndUpdate(id, {
        ...data,
        updatedBy: id,
        updatedAt: new Date(),
      })

      return { id }
    })
  }

  async handleRemove(id: ObjectId): Promise<{ id: ObjectId }> {
    return record('LocationService.handleRemove', async () => {
      const result = await LocationModel.findByIdAndDelete(id)
      if (!result) throw err.notFound(id)
      return { id }
    })
  }
}
