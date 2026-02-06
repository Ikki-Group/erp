import { eq, ilike, or } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import type { PaginatedResponse } from '@/lib/types'
import { calculatePaginationMeta } from '@/lib/utils/pagination.util'
import { hashPassword } from '@/lib/utils/password.util'
import { users, type NewUser, type User } from '@/database/schema'
import { db } from '@/database'

import type { IamDto } from '../iam.dto'

/**
 * IAM Users Service
 * Handles all user-related business logic including CRUD operations
 */
export class IamUsersService {
  async list(params: IamDto.ListUsers): Promise<PaginatedResponse<User>> {
    const { page, limit, search, isActive } = params
    const offset = (page - 1) * limit

    // Build query conditions
    const conditions = []
    if (search) {
      conditions.push(or(ilike(users.email, `%${search}%`), ilike(users.username, `%${search}%`)))
    }
    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive))
    }

    // Execute query
    const query = db.select().from(users)
    if (conditions.length > 0) {
      query.where(conditions.length === 1 ? conditions[0]! : or(...conditions))
    }

    const results = await query.limit(limit).offset(offset)
    const total = results.length // TODO: Implement proper count query

    return {
      data: results,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  async getById(id: number): Promise<User> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!user) {
      throw new NotFoundError('User not found')
    }

    return user
  }

  async create(dto: IamDto.CreateUser): Promise<User> {
    // Check if email already exists
    const [existingEmail] = await db.select().from(users).where(eq(users.email, dto.email)).limit(1)

    if (existingEmail) {
      throw new ConflictError('User with this email already exists', 'EMAIL_EXISTS')
    }

    // Check if username already exists
    const [existingUsername] = await db.select().from(users).where(eq(users.username, dto.username)).limit(1)

    if (existingUsername) {
      throw new ConflictError('User with this username already exists', 'USERNAME_EXISTS')
    }

    // Hash password
    const passwordHash = await hashPassword(dto.password)

    // Create user
    const newUser: NewUser = {
      email: dto.email,
      username: dto.username,
      fullname: dto.fullname,
      passwordHash,
      isRoot: false,
      isActive: true,
      createdBy: 1, // TODO: Get from auth context
      updatedBy: 1, // TODO: Get from auth context
    }

    const [user] = await db.insert(users).values(newUser).returning()
    return user!
  }

  async update(id: number, dto: IamDto.UpdateUser): Promise<User> {
    // Check if user exists
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Check email uniqueness if being updated
    if (dto.email && dto.email !== user.email) {
      const [existingEmail] = await db.select().from(users).where(eq(users.email, dto.email)).limit(1)

      if (existingEmail) {
        throw new ConflictError('Email already in use', 'EMAIL_EXISTS')
      }
    }

    // Check username uniqueness if being updated
    if (dto.username && dto.username !== user.username) {
      const [existingUsername] = await db.select().from(users).where(eq(users.username, dto.username)).limit(1)

      if (existingUsername) {
        throw new ConflictError('Username already in use', 'USERNAME_EXISTS')
      }
    }

    // Prepare update data
    const updateData: Partial<NewUser> = {
      ...dto,
      updatedBy: 1, // TODO: Get from auth context
    }

    if (dto.password) {
      updateData.passwordHash = await hashPassword(dto.password)
      delete (updateData as { password?: string }).password
    }

    const [updatedUser] = await db.update(users).set(updateData).where(eq(users.id, id)).returning()

    return updatedUser!
  }

  async delete(id: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!user) {
      throw new NotFoundError('User not found')
    }

    await db.delete(users).where(eq(users.id, id))
  }
}
