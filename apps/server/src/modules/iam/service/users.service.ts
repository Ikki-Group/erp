import { and, count, eq, ilike, ne, or } from 'drizzle-orm'

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
  /**
   * List users with pagination and filtering
   */
  async list(params: IamDto.ListUsers): Promise<PaginatedResponse<User>> {
    const { page, limit, search, isActive } = params
    const offset = (page - 1) * limit

    // Build query conditions
    const conditions = []

    // Search filter - search in email, username, or fullname
    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.username, `%${search}%`),
          ilike(users.fullname, `%${search}%`)
        )
      )
    }

    // Active status filter
    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive))
    }

    // Combine all conditions with AND
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Execute queries in parallel for better performance
    const [results, totalResult] = await Promise.all([
      db.select().from(users).where(whereClause).limit(limit).offset(offset).orderBy(users.id),
      db.select({ total: count() }).from(users).where(whereClause),
    ])

    const total = totalResult[0]?.total ?? 0

    return {
      data: results,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Get user by ID
   */
  async getById(id: number): Promise<User> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`, 'USER_NOT_FOUND')
    }

    return user
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return user ?? null
  }

  /**
   * Get user by username
   */
  async getByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)
    return user ?? null
  }

  /**
   * Create a new user
   */
  async create(dto: IamDto.CreateUser, createdBy = 1): Promise<User> {
    // Check for existing email or username in a single query
    const existing = await db
      .select({ email: users.email, username: users.username })
      .from(users)
      .where(or(eq(users.email, dto.email), eq(users.username, dto.username)))
      .limit(2)

    // Check for conflicts
    const emailExists = existing.some((u) => u.email === dto.email)
    const usernameExists = existing.some((u) => u.username === dto.username)

    if (emailExists && usernameExists) {
      throw new ConflictError('Email and username already exist', 'EMAIL_USERNAME_EXISTS', {
        email: dto.email,
        username: dto.username,
      })
    }

    if (emailExists) {
      throw new ConflictError('User with this email already exists', 'EMAIL_EXISTS', {
        email: dto.email,
      })
    }

    if (usernameExists) {
      throw new ConflictError('User with this username already exists', 'USERNAME_EXISTS', {
        username: dto.username,
      })
    }

    // Hash password
    const passwordHash = await hashPassword(dto.password)

    // Create user in a transaction
    const [user] = await db.transaction(async (tx) => {
      const newUser: NewUser = {
        email: dto.email.toLowerCase().trim(),
        username: dto.username.toLowerCase().trim(),
        fullname: dto.fullname.trim(),
        passwordHash,
        isRoot: false,
        isActive: true,
        createdBy,
        updatedBy: createdBy,
      }

      return tx.insert(users).values(newUser).returning()
    })

    return user!
  }

  /**
   * Update an existing user
   */
  async update(id: number, dto: IamDto.UpdateUser, updatedBy = 1): Promise<User> {
    // Check if user exists
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`, 'USER_NOT_FOUND')
    }

    // Check for uniqueness conflicts if email or username is being updated
    const conditions = []
    if (dto.email && dto.email !== user.email) {
      conditions.push(eq(users.email, dto.email))
    }
    if (dto.username && dto.username !== user.username) {
      conditions.push(eq(users.username, dto.username))
    }

    if (conditions.length > 0) {
      const existing = await db
        .select({ email: users.email, username: users.username })
        .from(users)
        .where(and(ne(users.id, id), or(...conditions)))
        .limit(2)

      const emailConflict = dto.email && existing.some((u) => u.email === dto.email)
      const usernameConflict = dto.username && existing.some((u) => u.username === dto.username)

      if (emailConflict && usernameConflict) {
        throw new ConflictError('Email and username already in use', 'EMAIL_USERNAME_EXISTS', {
          email: dto.email,
          username: dto.username,
        })
      }

      if (emailConflict) {
        throw new ConflictError('Email already in use', 'EMAIL_EXISTS', { email: dto.email })
      }

      if (usernameConflict) {
        throw new ConflictError('Username already in use', 'USERNAME_EXISTS', { username: dto.username })
      }
    }

    // Update user in a transaction
    const [updatedUser] = await db.transaction(async (tx) => {
      // Prepare update data
      const updateData: Partial<NewUser> = {
        updatedBy,
      }

      if (dto.email) updateData.email = dto.email.toLowerCase().trim()
      if (dto.username) updateData.username = dto.username.toLowerCase().trim()
      if (dto.fullname) updateData.fullname = dto.fullname.trim()
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive
      if (dto.password) {
        updateData.passwordHash = await hashPassword(dto.password)
      }

      return tx.update(users).set(updateData).where(eq(users.id, id)).returning()
    })

    return updatedUser!
  }

  /**
   * Delete a user (hard delete)
   * Note: Consider implementing soft delete for audit purposes
   */
  async delete(id: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`, 'USER_NOT_FOUND')
    }

    // Prevent deletion of root users
    if (user.isRoot) {
      throw new ConflictError('Cannot delete root user', 'ROOT_USER_DELETE_FORBIDDEN', { userId: id })
    }

    await db.delete(users).where(eq(users.id, id))
  }

  /**
   * Toggle user active status
   */
  async toggleActive(id: number, updatedBy = 1): Promise<User> {
    const user = await this.getById(id)

    const [updatedUser] = await db
      .update(users)
      .set({
        isActive: !user.isActive,
        updatedBy,
      })
      .where(eq(users.id, id))
      .returning()

    return updatedUser!
  }
}
