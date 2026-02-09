import { and, eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import ms from 'ms'

import { UnauthorizedError } from '@server/lib/error/http'
import { verifyPassword } from '@server/lib/utils/password.util'
import { locations, roles, userRoleAssignments, users } from '@server/database/schema'
import { env } from '@server/config/env'
import { db } from '@server/database'

import type { IamSchema } from '../iam.types'
import type { IamUsersService } from './users.service'

export interface JWTPayload {
  sub: number
  email: string
  username: string
  isRoot: boolean
  iat?: number
  exp?: number
}

export class IamAuthService {
  constructor(private readonly usersService: IamUsersService) {}

  /**
   * Finds a user by email or username
   */
  async findUserByIdentifier(identifier: string): Promise<typeof users.$inferSelect | null> {
    const [user] = await db.select().from(users).where(eq(users.email, identifier.toLowerCase())).limit(1).execute()

    if (user) return user

    const [userByUsername] = await db
      .select()
      .from(users)
      .where(eq(users.username, identifier.toLowerCase()))
      .limit(1)
      .execute()

    return userByUsername ?? null
  }

  /**
   * Authenticates a user by email/username and password
   */
  async login(identifier: string, password: string): Promise<{ user: IamSchema.UserWithAccess; token: string }> {
    const targetUser = await this.findUserByIdentifier(identifier)

    if (!targetUser || !targetUser.isActive) {
      throw new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS')
    }

    const isPasswordValid = await verifyPassword(password, targetUser.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS')
    }

    const token = this.generateToken(targetUser)
    const userWithAccess = await this.getUserDetails(targetUser.id)

    return {
      user: userWithAccess,
      token,
    }
  }

  /**
   * Retrieves user detailed information with locations and roles
   */
  async getUserDetails(userId: number): Promise<IamSchema.UserWithAccess> {
    const user = await this.usersService.getById(userId)
    let userLocations: { id: number; code: string; name: string; role: string }[] = []

    if (user.isRoot) {
      // Get all active locations
      const allLocations = await db
        .select({
          id: locations.id,
          code: locations.code,
          name: locations.name,
        })
        .from(locations)
        .where(eq(locations.isActive, true))

      userLocations = allLocations.map((loc) => ({
        ...loc,
        role: 'superadmin',
      }))
    } else {
      // Get assigned locations and roles
      const assignments = await db
        .select({
          id: locations.id,
          code: locations.code,
          name: locations.name,
          role: roles.code,
        })
        .from(userRoleAssignments)
        .innerJoin(locations, eq(userRoleAssignments.locationId, locations.id))
        .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
        .where(eq(userRoleAssignments.userId, userId))

      userLocations = assignments
    }

    // eslint-disable-next-line unused-imports/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user

    return {
      ...userWithoutPassword,
      locations: userLocations,
    }
  }

  /**
   * Retrieves user permissions at a specific location
   */
  async getUserPermissions(userId: number, locationId?: number): Promise<string[]> {
    const user = await this.usersService.getById(userId)
    if (user.isRoot) {
      return ['*'] // Root has all permissions
    }

    if (!locationId) return []

    const userRoles = await db
      .select({ code: roles.code })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
      .where(and(eq(userRoleAssignments.userId, userId), eq(userRoleAssignments.locationId, locationId)))

    return userRoles.map((r) => r.code)
  }

  /**
   * Generates a JWT token for a user
   */
  generateToken(user: typeof users.$inferSelect): string {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      isRoot: user.isRoot,
    }

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: ms(env.JWT_EXPIRES_IN as ms.StringValue),
    })
  }

  /**
   * Verifies a JWT token and returns the payload
   */
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as unknown as JWTPayload
    } catch {
      throw new UnauthorizedError('Invalid or expired token', 'AUTH_TOKEN_INVALID')
    }
  }
}
