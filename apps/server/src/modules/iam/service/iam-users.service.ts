import { and, count, eq, ilike, ne, or } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@server/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@server/lib/utils/pagination.util'
import { hashPassword } from '@server/lib/utils/password.util'
import { users } from '@server/database/schema'
import { db } from '@server/database'

interface IFilter {
  search?: string
  isActive?: boolean
}

/**
 * Handles all user-related business logic including CRUD operations
 */
export class IamUsersService {
  err = {
    NOT_FOUND: 'USER_NOT_FOUND',
    EMAIL_EXISTS: 'USER_EMAIL_EXISTS',
    USERNAME_EXISTS: 'USER_USERNAME_EXISTS',
    EMAIL_USERNAME_EXISTS: 'USER_EMAIL_USERNAME_EXISTS',
    ROOT_USER_DELETE_FORBIDDEN: 'ROOT_USER_DELETE_FORBIDDEN',
  }

  /**
   * Builds a dynamic query with filters
   * Returns a query builder that can be further modified
   */
  private buildFilteredQuery(filter: IFilter) {
    const { search, isActive } = filter
    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.username, `%${search}%`),
          ilike(users.fullname, `%${search}%`)
        )
      )
    }

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    return db.select().from(users).where(whereClause).$dynamic()
  }

  /**
   * Lists all users matching the filter criteria
   */
  list(filter: IFilter) {
    return this.buildFilteredQuery(filter).orderBy(users.id)
  }

  /**
   * Counts total users matching the filter criteria
   */
  async count(filter: IFilter): Promise<number> {
    const { search, isActive } = filter
    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.username, `%${search}%`),
          ilike(users.fullname, `%${search}%`)
        )
      )
    }

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    const [result] = await db.select({ total: count() }).from(users).where(whereClause)

    return result?.total ?? 0
  }

  /**
   * Lists users with pagination
   * Executes data fetch and count in parallel for better performance
   */
  async listPaginated(filter: IFilter, pq: PaginationQuery): Promise<WithPaginationResult<typeof users.$inferSelect>> {
    const { page, limit } = pq

    const [data, total] = await Promise.all([
      withPagination(this.buildFilteredQuery(filter).orderBy(users.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Retrieves a user by its ID
   * Throws NotFoundError if user doesn't exist
   */
  async getById(id: number): Promise<typeof users.$inferSelect> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`, this.err.NOT_FOUND)
    }

    return user
  }

  /**
   * Retrieves a user by its email
   * Returns null if not found
   */
  async getByEmail(email: string): Promise<typeof users.$inferSelect | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return user ?? null
  }

  /**
   * Retrieves a user by its username
   * Returns null if not found
   */
  async getByUsername(username: string): Promise<typeof users.$inferSelect | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)
    return user ?? null
  }

  /**
   * Creates a new user with validation
   * Checks for email and username uniqueness before creation
   */
  async create(
    dto: { email: string; username: string; fullname: string; password: string },
    createdBy = 1
  ): Promise<typeof users.$inferSelect> {
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
      throw new ConflictError('Email and username already exist', this.err.EMAIL_USERNAME_EXISTS, {
        email: dto.email,
        username: dto.username,
      })
    }

    if (emailExists) {
      throw new ConflictError('User with this email already exists', this.err.EMAIL_EXISTS, {
        email: dto.email,
      })
    }

    if (usernameExists) {
      throw new ConflictError('User with this username already exists', this.err.USERNAME_EXISTS, {
        username: dto.username,
      })
    }

    // Hash password
    const passwordHash = await hashPassword(dto.password)

    // Create user in a transaction
    const [user] = await db.transaction(async (tx) => {
      const newUser: typeof users.$inferInsert = {
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
   * Updates an existing user
   * Validates uniqueness and updates fields
   */
  async update(
    id: number,
    dto: { email?: string; username?: string; fullname?: string; password?: string; isActive?: boolean },
    updatedBy = 1
  ): Promise<typeof users.$inferSelect> {
    // Check if user exists
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`, this.err.NOT_FOUND)
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
        throw new ConflictError('Email and username already in use', this.err.EMAIL_USERNAME_EXISTS, {
          email: dto.email,
          username: dto.username,
        })
      }

      if (emailConflict) {
        throw new ConflictError('Email already in use', this.err.EMAIL_EXISTS, { email: dto.email })
      }

      if (usernameConflict) {
        throw new ConflictError('Username already in use', this.err.USERNAME_EXISTS, { username: dto.username })
      }
    }

    // Update user in a transaction
    const [updatedUser] = await db.transaction(async (tx) => {
      // Prepare update data
      const updateData: Partial<typeof users.$inferInsert> = {
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
   * Deletes a user permanently
   * Prevents deletion of root users
   */
  async delete(id: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`, this.err.NOT_FOUND)
    }

    // Prevent deletion of root users
    if (user.isRoot) {
      throw new ConflictError('Cannot delete root user', this.err.ROOT_USER_DELETE_FORBIDDEN, { userId: id })
    }

    await db.delete(users).where(eq(users.id, id))
  }

  /**
   * Toggles user active status
   */
  async toggleActive(id: number, updatedBy = 1): Promise<typeof users.$inferSelect> {
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
