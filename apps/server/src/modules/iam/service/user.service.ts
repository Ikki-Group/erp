import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage } from 'mongoose'

import { cache } from '@/lib/cache'
import { PipelineBuilder, pipelineHelper } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/pagination'
import { hashPassword } from '@/lib/password'

import type { LocationServiceModule } from '@/modules/location'

import { SEED_CONFIG } from '@/config/seed-config'

import type { UserDetailDto, UserFilterDto, UserMutationDto } from '../dto'
import { UserDto, UserSelectDto } from '../dto'
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
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class UserService {
  constructor(
    private readonly roleSvc: RoleService,
    private readonly locationSvc: LocationServiceModule
  ) {}
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
      const result = await PipelineBuilder.create(UserModel)
        .push(pipelineHelper.$matchId(id), pipelineHelper.$setId())
        .execOne({ schema: UserDto })

      if (!result) throw err.notFound(id)
      return result
    })
  }

  async count(): Promise<number> {
    return record('UserService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        return UserModel.countDocuments()
      })
    })
  }

  async getDetailById(id: ObjectId): Promise<UserDetailDto> {
    return record('UserService.getDetailById', async () => {
      const userDoc = await this.findById(id)
      const userDetails: UserDetailDto = {
        ...userDoc,
        assignments: [],
      }

      const isRoot = userDoc.isRoot
      if (!isRoot && userDoc.assignments.length === 0) return userDetails

      const [roles, locations] = await Promise.all([this.roleSvc.find(), this.locationSvc.location.find()])

      if (isRoot) {
        const roleSuperadmin = roles.find((r) => r.code === SEED_CONFIG.ROLE_SUPERADMIN_CODE)!

        userDetails.assignments = locations.map((l) => {
          return {
            isDefault: false,
            locationId: l.id,
            roleId: roleSuperadmin.id,
            location: l,
            role: roleSuperadmin,
          }
        })
      } else {
        userDetails.assignments = userDoc.assignments.map((a) => {
          return {
            ...a,
            role: roles.find((r) => r.id.equals(a.roleId))!,
            location: locations.find((l) => l.id.equals(a.locationId))!,
          }
        })
      }

      return userDetails
    })
  }

  /** Checks whether email or username is already taken, optionally excluding a user. */
  async #checkConflict(input: Pick<UserMutationDto, 'email' | 'username'>, existing?: UserDto): Promise<void> {
    return record('UserService.#checkConflict', async () => {
      const emailChanged = !existing || existing.email !== input.email
      const usernameChanged = !existing || existing.username !== input.username

      if (!emailChanged && !usernameChanged) return

      const $or = [
        ...(emailChanged ? [{ email: input.email.toLowerCase() }] : []),
        ...(usernameChanged ? [{ username: input.username.toLowerCase() }] : []),
      ]

      const conflict = await UserModel.findOne(existing ? { _id: { $ne: existing.id }, $or } : { $or })
        .select('email username')
        .lean()

      if (!conflict) return
      if (emailChanged && conflict.email === input.email.toLowerCase().trim()) throw err.emailExist(input.email)
      if (usernameChanged && conflict.username === input.username.toLowerCase().trim())
        throw err.usernameExist(input.username)
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

      return pbWithFilter.execPaginated({
        schema: UserSelectDto.array(),
        pq,
        facetAfter: [pipelineHelper.$setId()],
      })
    })
  }

  async handleDetail(id: ObjectId): Promise<UserDetailDto> {
    return record('UserService.handleDetail', async () => {
      return this.getDetailById(id)
    })
  }

  async handleCreate(data: UserMutationDto): Promise<{ id: ObjectId }> {
    return record('UserService.handleCreate', async () => {
      const email = data.email.toLowerCase().trim()
      const username = data.username.toLowerCase().trim()

      await this.#checkConflict({ email, username })

      const user = new UserModel({
        ...data,
        email,
        username,
      })
      user.passwordHash = await hashPassword(data.password)
      user.createdBy = user._id
      user.updatedBy = user._id

      await user.save()
      void cache.del(cacheKey.count)
      return { id: user._id }
    })
  }

  async handleUpdate(id: ObjectId, data: Partial<UserMutationDto>): Promise<{ id: ObjectId }> {
    return record('UserService.handleUpdate', async () => {
      const existing = await this.findById(id)

      const email = data.email ? data.email.toLowerCase().trim() : existing.email
      const username = data.username ? data.username.toLowerCase().trim() : existing.username

      await this.#checkConflict({ email, username }, existing)

      const passwordHash = data.password ? await hashPassword(data.password) : undefined

      await UserModel.findByIdAndUpdate(id, {
        ...data,
        email,
        username,
        ...(passwordHash && { passwordHash }),
        updatedBy: id,
        updatedAt: new Date(),
      })

      void cache.del(cacheKey.count)
      return { id }
    })
  }

  async handleRemove(id: ObjectId): Promise<{ id: ObjectId }> {
    return record('UserService.handleRemove', async () => {
      const result = await UserModel.findByIdAndDelete(id)
      if (!result) throw err.notFound(id)

      void cache.del(cacheKey.count)
      return { id }
    })
  }
}
