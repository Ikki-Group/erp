import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage, Types } from 'mongoose'

import { PipelineBuilder, pipelineHelper } from '@/lib/db'
import { BadRequestError, ConflictError, NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/pagination'

import { RoleDto, type RoleFilterDto, type RoleMutationDto } from '../dto'
import { RoleModel } from '../model'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: ObjectId) => new NotFoundError(`Role with ID ${id} not found`, 'ROLE_NOT_FOUND'),
  codeConflict: (code: string) => new ConflictError(`Role code ${code} already exists`, 'ROLE_CODE_ALREADY_EXISTS'),
  nameConflict: (name: string) => new ConflictError(`Role name ${name} already exists`, 'ROLE_NAME_ALREADY_EXISTS'),
  systemRole: () => new BadRequestError('Cannot mutate a system role', 'ROLE_IS_SYSTEM'),
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class RoleService {
  /* ----------------------------- UTILITY METHODS ---------------------------- */
  // These are reusable internal helpers, consumed by handler methods below
  // and potentially by other services (e.g. AuthService, UserService).

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
      return RoleModel.countDocuments()
    })
  }

  /** Checks for code/name conflicts. Excludes the given existing role on update. */
  async #checkConflict(input: Pick<RoleMutationDto, 'code' | 'name'>, existing?: RoleDto): Promise<void> {
    const codeChanged = !existing || existing.code !== input.code
    const nameChanged = !existing || existing.name !== input.name

    if (!codeChanged && !nameChanged) return

    const $or = [
      ...(codeChanged ? [{ code: input.code.toUpperCase().trim() }] : []),
      ...(nameChanged ? [{ name: input.name.trim() }] : []),
    ]

    const conflict = await RoleModel.findOne(existing ? { _id: { $ne: existing.id }, $or } : { $or })
      .select('code name')
      .lean()

    if (!conflict) return
    if (codeChanged && conflict.code === input.code.toUpperCase().trim()) throw err.codeConflict(input.code)
    if (nameChanged && conflict.name === input.name.trim()) throw err.nameConflict(input.name)
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

  async handleCreate(data: RoleMutationDto): Promise<{ id: Types.ObjectId }> {
    return record('RoleService.handleCreate', async () => {
      const code = data.code.toUpperCase().trim()
      const name = data.name.trim()

      await this.#checkConflict({ code, name })

      const role = new RoleModel({
        ...data,
        code,
        name,
      })
      role.createdBy = role._id
      role.updatedBy = role._id

      await role.save()
      return { id: role._id }
    })
  }

  async handleUpdate(id: ObjectId, data: Partial<RoleMutationDto>): Promise<{ id: Types.ObjectId }> {
    return record('RoleService.handleUpdate', async () => {
      const existing = await this.findById(id)

      if (existing.isSystem) throw err.systemRole()

      const code = data.code ? data.code.toUpperCase().trim() : existing.code
      const name = data.name ? data.name.trim() : existing.name

      await this.#checkConflict({ code, name }, existing)

      await RoleModel.findByIdAndUpdate(id, {
        ...data,
        code,
        name,
        updatedBy: id,
        updatedAt: new Date(),
      })

      return { id }
    })
  }

  async handleRemove(id: ObjectId): Promise<{ id: Types.ObjectId }> {
    return record('RoleService.handleRemove', async () => {
      const existing = await this.findById(id)

      if (existing.isSystem) throw err.systemRole()

      const result = await RoleModel.findByIdAndDelete(id)
      if (!result) throw err.notFound(id)
      return { id }
    })
  }
}
