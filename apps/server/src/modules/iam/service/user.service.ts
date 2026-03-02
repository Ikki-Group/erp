import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage } from 'mongoose'

import { cache } from '@/lib/cache'
import { PipelineBuilder, pipelineHelper } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/pagination'
import { hashPassword } from '@/lib/password'
import { toLookupMap } from '@/lib/utils/collection.util'

import type { LocationDto, LocationServiceModule } from '@/modules/location'

import { SEED_CONFIG } from '@/config/seed-config'

import type { RoleDto, UserAssignmentDetailDto, UserFilterDto, UserMutationDto, UserSelectDto } from '../dto'
import { UserDto } from '../dto'
import { UserModel } from '../model'

import type { RoleService } from './role.service'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: ObjectId) => new NotFoundError(`User with ID ${id} not found`, 'USER_NOT_FOUND'),
  emailExist: (email: string) => new ConflictError(`Email ${email} already exists`, 'USER_EMAIL_ALREADY_EXISTS'),
  usernameExist: (username: string) =>
    new ConflictError(`Username ${username} already exists`, 'USER_USERNAME_ALREADY_EXISTS'),
}

const cacheKey = {
  count: 'user.count',
  list: 'user.list',
  byId: (id: ObjectId) => `user.byId.${id}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class UserService {
  constructor(
    private readonly roleSvc: RoleService,
    private readonly locationSvc: LocationServiceModule
  ) {}

  /** Checks whether email or username is already taken, optionally excluding a user.
   *  Expects input.email and input.username to be already normalized (lowercased/trimmed). */
  async #checkConflict(
    input: Pick<UserMutationDto, 'email' | 'username'>,
    existing?: Pick<UserDto, 'id' | 'email' | 'username'>
  ): Promise<void> {
    return record('UserService.#checkConflict', async () => {
      const emailChanged = !existing || existing.email !== input.email
      const usernameChanged = !existing || existing.username !== input.username

      if (!emailChanged && !usernameChanged) return

      const $or = [
        ...(emailChanged ? [{ email: input.email }] : []),
        ...(usernameChanged ? [{ username: input.username }] : []),
      ]

      const conflict = await UserModel.findOne(existing ? { _id: { $ne: existing.id }, $or } : { $or })
        .select('email username')
        .lean()

      if (!conflict) return
      if (emailChanged && conflict.email === input.email) throw err.emailExist(input.email)
      if (usernameChanged && conflict.username === input.username) throw err.usernameExist(input.username)
    })
  }

  /** Pure mapping — no I/O. Resolves assignment refs into full detail objects.
   *  Accepts optional pre-built Maps for O(1) lookups (useful in batch/list contexts). */
  #resolveAssignments(
    user: UserDto,
    roles: RoleDto[],
    locations: LocationDto[],
    roleMap?: Map<string, RoleDto>,
    locationMap?: Map<string, LocationDto>
  ): UserAssignmentDetailDto[] {
    if (user.isRoot) {
      const superadmin = roles.find((r) => r.code === SEED_CONFIG.ROLE_SUPERADMIN_CODE)!
      return locations.map((l) => ({
        isDefault: false,
        locationId: l.id,
        roleId: superadmin.id,
        location: l,
        role: superadmin,
      }))
    }

    if (user.assignments.length === 0) return []

    // Use Maps when provided (batch), fall back to building one (single)
    const rMap = roleMap ?? toLookupMap(roles, 'id')
    const lMap = locationMap ?? toLookupMap(locations, 'id')

    return user.assignments.map((a) => ({
      ...a,
      role: rMap.get(a.roleId.toString())!,
      location: lMap.get(a.locationId.toString())!,
    }))
  }

  /* ----------------------------- UTILITY METHODS ---------------------------- */
  // These are reusable internal helpers. They are consumed by handler methods
  // below and can also be used by other services (e.g. AuthService).

  async seed(
    data: (Pick<UserDto, 'id' | 'email' | 'username' | 'fullname' | 'isRoot' | 'createdBy'> & { password: string })[]
  ): Promise<void> {
    return record('UserService.seed', async () => {
      const at = new Date()

      // Bulk upsert
      const users: UserDto[] = []

      for (const d of data) {
        users.push({
          ...d,
          passwordHash: await hashPassword(d.password),
          isActive: true,
          assignments: [],
          createdAt: at,
          updatedAt: at,
          createdBy: d.createdBy,
          updatedBy: d.createdBy,
        })
      }

      await UserModel.bulkWrite(
        users.map((u) => ({
          replaceOne: {
            filter: { email: u.email },
            replacement: u,
            upsert: true,
          },
        }))
      )
    })
  }

  /** Finds a single user document by its ID. Throws NotFoundError if missing. */
  async findById(id: ObjectId): Promise<UserDto> {
    return record('UserService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const result = await PipelineBuilder.create(UserModel)
          .push(pipelineHelper.$matchId(id), pipelineHelper.$setId())
          .execOne({ schema: UserDto })

        if (!result) throw err.notFound(id)
        return result
      })
    })
  }

  async findByIdentifier(identifier: string): Promise<UserDto | null> {
    return record('UserService.findByIdentifier', async () => {
      const user = await PipelineBuilder.create(UserModel)
        .push(
          pipelineHelper.$match({ $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }] })
        )
        .push(pipelineHelper.$setId())
        .execOne({ schema: UserDto })

      return user
    })
  }

  async count(): Promise<number> {
    return record('UserService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        return UserModel.countDocuments()
      })
    })
  }

  async getAssignments(user: UserDto): Promise<UserAssignmentDetailDto[]> {
    return record('UserService.getAssignments', async () => {
      const [roles, locations] = await Promise.all([this.roleSvc.find(), this.locationSvc.location.find()])
      return this.#resolveAssignments(user, roles, locations)
    })
  }

  async getDetailById(id: ObjectId): Promise<UserSelectDto> {
    return record('UserService.getDetailById', async () => {
      const userDoc = await this.findById(id)
      const userDetails: UserSelectDto = {
        ...userDoc,
        assignments: await this.getAssignments(userDoc),
      }

      return userDetails
    })
  }

  /* ------------------------------ HANDLER METHODS --------------------------- */
  // One handler per route endpoint. These call utility methods and orchestrate
  // the response. They are named after the HTTP action they serve.

  async handleList(filter: UserFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<UserSelectDto>> {
    return record('UserService.handleList', async () => {
      const $match: PipelineStage.Match['$match'] = {}

      if (filter.search) $match.$text = { $search: filter.search, $diacriticSensitive: true }
      if (typeof filter.isActive === 'boolean') $match.isActive = filter.isActive

      const pb = PipelineBuilder.create(UserModel)
      const pbWithFilter = Object.keys($match).length > 0 ? pb.push(pipelineHelper.$match($match)) : pb

      const { data: users, meta } = await pbWithFilter.execPaginated({
        schema: UserDto.array(),
        pq,
        facetAfter: [pipelineHelper.$setId()],
      })

      // Build lookup maps ONCE for the entire page
      const [roles, locations] = await Promise.all([this.roleSvc.find(), this.locationSvc.location.find()])
      const roleMap = toLookupMap(roles, 'id')
      const locationMap = toLookupMap(locations, 'id')

      const data: UserSelectDto[] = users.map((u) => ({
        ...u,
        assignments: this.#resolveAssignments(u, roles, locations, roleMap, locationMap),
      }))

      return { data, meta }
    })
  }

  async handleDetail(id: ObjectId): Promise<UserSelectDto> {
    return record('UserService.handleDetail', async () => {
      return this.getDetailById(id)
    })
  }

  async handleCreate(data: UserMutationDto): Promise<{ id: ObjectId }> {
    return record('UserService.handleCreate', async () => {
      const { password, ...rest } = data
      const email = rest.email.toLowerCase().trim()
      const username = rest.username.toLowerCase().trim()

      await this.#checkConflict({ email, username })

      const user = new UserModel({ ...rest, email, username })
      user.passwordHash = await hashPassword(password)
      user.createdBy = user._id
      user.updatedBy = user._id

      await user.save()
      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      return { id: user._id }
    })
  }

  async handleUpdate(id: ObjectId, data: Partial<UserMutationDto>): Promise<{ id: ObjectId }> {
    return record('UserService.handleUpdate', async () => {
      // Lightweight query — only fields needed for conflict check
      const existing = await UserModel.findById(id).select('email username').lean()
      if (!existing) throw err.notFound(id)

      const { password, ...rest } = data
      const email = rest.email ? rest.email.toLowerCase().trim() : existing.email
      const username = rest.username ? rest.username.toLowerCase().trim() : existing.username

      await this.#checkConflict(
        { email, username },
        { id: existing._id, email: existing.email, username: existing.username }
      )

      const passwordHash = password ? await hashPassword(password) : undefined

      await UserModel.findByIdAndUpdate(id, {
        ...rest,
        email,
        username,
        ...(passwordHash && { passwordHash }),
        updatedBy: id,
        updatedAt: new Date(),
      })

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      void cache.del(cacheKey.byId(id))
      return { id }
    })
  }

  async handleRemove(id: ObjectId): Promise<{ id: ObjectId }> {
    return record('UserService.handleRemove', async () => {
      const result = await UserModel.findByIdAndDelete(id)
      if (!result) throw err.notFound(id)

      void cache.del(cacheKey.count)
      void cache.del(cacheKey.list)
      void cache.del(cacheKey.byId(id))
      return { id }
    })
  }
}
