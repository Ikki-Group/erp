import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage, Types } from 'mongoose'

import { cache } from '@/lib/cache'
import { checkConflict, PipelineBuilder, pipelineHelper, stampCreate, stampUpdate, type ConflictField } from '@/lib/db'
import { BadRequestError, NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import { RoleDto, type RoleFilterDto, type RoleMutationDto } from '../dto'
import { RoleModel } from '../model'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: ObjectId) => new NotFoundError(`Role with ID ${id} not found`, 'ROLE_NOT_FOUND'),
  systemRole: () => new BadRequestError('Cannot mutate a system role', 'ROLE_IS_SYSTEM'),
}

const uniqueFields: ConflictField<Pick<RoleMutationDto, 'code' | 'name'>>[] = [
  { field: 'code', message: 'Role code already exists', code: 'ROLE_CODE_ALREADY_EXISTS' },
  { field: 'name', message: 'Role name already exists', code: 'ROLE_NAME_ALREADY_EXISTS' },
]

const cacheKey = {
  count: 'role.count',
  list: 'role.list',
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class RoleService {
  /* ----------------------------- UTILITY METHODS ---------------------------- */
  // These are reusable internal helpers, consumed by handler methods below
  // and potentially by other services (e.g. AuthService, UserService).

  async seed(data: Pick<RoleDto, 'id' | 'code' | 'name' | 'createdBy'>[]): Promise<void> {
    return record('RoleService.seed', async () => {
      // Bulk upsert
      const roles: RoleDto[] = data.map((d) => ({
        ...d,
        isSystem: false,
        ...stampCreate(d.createdBy),
      }))

      await RoleModel.bulkWrite(
        roles.map((r) => ({
          replaceOne: {
            filter: { code: r.code },
            replacement: r,
            upsert: true,
          },
        }))
      )
    })
  }

  async find(): Promise<RoleDto[]> {
    return record('RoleService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return PipelineBuilder.create(RoleModel).push(pipelineHelper.$setId()).exec({ schema: RoleDto.array() })
      })
    })
  }

  /** Finds a single role document by its ID. Throws NotFoundError if missing. */
  async findById(id: ObjectId): Promise<RoleDto> {
    return record('RoleService.findById', async () => {
      const result = await PipelineBuilder.create(RoleModel)
        .push(pipelineHelper.$matchId(id), pipelineHelper.$setId())
        .execOne({ schema: RoleDto })

      if (!result) throw err.notFound(id)
      return result
    })
  }

  async count(): Promise<number> {
    return record('RoleService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        return RoleModel.countDocuments()
      })
    })
  }

  /* ------------------------------ HANDLER METHODS --------------------------- */
  // One handler per route endpoint. These call utility methods and orchestrate
  // the response. They are named after the HTTP action they serve.

  async handleList(filter: RoleFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<RoleDto>> {
    return record('RoleService.handleList', async () => {
      const $match: PipelineStage.Match['$match'] = {}

      if (filter.search) $match.$text = { $search: filter.search, $diacriticSensitive: true }

      const pb = PipelineBuilder.create(RoleModel)
      const pbWithFilter = Object.keys($match).length > 0 ? pb.push(pipelineHelper.$match($match)) : pb

      return pbWithFilter.execPaginated({
        schema: RoleDto.array(),
        pq,
        facetAfter: [pipelineHelper.$setId()],
      })
    })
  }

  async handleDetail(id: ObjectId): Promise<RoleDto> {
    return record('RoleService.handleDetail', async () => {
      return this.findById(id)
    })
  }

  async handleCreate(data: RoleMutationDto, actorId: ObjectId): Promise<{ id: Types.ObjectId }> {
    return record('RoleService.handleCreate', async () => {
      const code = data.code.toUpperCase().trim()
      const name = data.name.trim()

      await checkConflict({ model: RoleModel, fields: uniqueFields, input: { code, name } })

      const role = new RoleModel({
        ...data,
        code,
        name,
        ...stampCreate(actorId),
      })

      await role.save()
      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id: role._id }
    })
  }

  async handleUpdate(id: ObjectId, data: Partial<RoleMutationDto>, actorId: ObjectId): Promise<{ id: Types.ObjectId }> {
    return record('RoleService.handleUpdate', async () => {
      const existing = await this.findById(id)

      if (existing.isSystem) throw err.systemRole()

      const code = data.code ? data.code.toUpperCase().trim() : existing.code
      const name = data.name ? data.name.trim() : existing.name

      await checkConflict({ model: RoleModel, fields: uniqueFields, input: { code, name }, existing })

      await RoleModel.findByIdAndUpdate(id, {
        ...data,
        code,
        name,
        ...stampUpdate(actorId),
      })

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id }
    })
  }

  async handleRemove(id: ObjectId): Promise<{ id: Types.ObjectId }> {
    return record('RoleService.handleRemove', async () => {
      const existing = await this.findById(id)

      if (existing.isSystem) throw err.systemRole()

      const result = await RoleModel.findByIdAndDelete(id)
      if (!result) throw err.notFound(id)

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id }
    })
  }
}
