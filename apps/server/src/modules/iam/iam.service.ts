import { db } from "@/db"
import { users, roles, userRoleAssignments } from "@/db/schema"
import { eq, or, ilike, and, count, desc } from "drizzle-orm"
import { hashPassword, verifyPassword } from "@/utils/password.util"
import { generateToken } from "@/utils/jwt.util"
import {
  HttpError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from "@/core/errors/http.error"
import { IamDto } from "./iam.dto"
import { calculatePaginationMeta } from "@/shared/dto"

export class IamService {
  /**
   * AUTH
   */
  async login(data: IamDto.Login) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1)

    if (!user) {
      throw new UnauthorizedError("Invalid email or password")
    }

    const isValid = await verifyPassword(data.password, user.passwordHash)
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password")
    }

    if (!user.isActive) {
      throw new UnauthorizedError("User account is inactive")
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    })

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id))

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
    }
  }

  async register(data: IamDto.Register) {
    const passwordHash = await hashPassword(data.password)

    try {
      const [user] = await db
        .insert(users)
        .values({
          username: data.email.split("@")[0] ?? "user",
          email: data.email,
          fullName: data.fullName,
          passwordHash,
          displayName: null,
          isActive: true,
        })
        .returning()

      if (!user) throw new Error("Failed to register user")

      return user
    } catch (error: any) {
      if (error.code === "23505") {
        throw new ConflictError("Email already exists")
      }
      throw error
    }
  }

  /**
   * USER
   */
  async getUsers(query: IamDto.UserQuery) {
    const { page = 1, limit = 10, search, isActive } = query
    const offset = (page - 1) * limit

    const where = and(
      search
        ? or(
            ilike(users.username, `%${search}%`),
            ilike(users.email, `%${search}%`),
            ilike(users.fullName, `%${search}%`),
          )
        : undefined,
      isActive !== undefined ? eq(users.isActive, isActive) : undefined,
    )

    const [totalResult] = await db
      .select({ value: count() })
      .from(users)
      .where(where)
    const total = Number(totalResult?.value ?? 0)

    const data = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        displayName: users.displayName,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt))

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  async getUserById(id: string) {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        displayName: users.displayName,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!user) throw new NotFoundError("User not found")
    return user
  }

  async createUser(data: IamDto.UserCreate) {
    const passwordHash = await hashPassword(data.password)

    try {
      const [user] = await db
        .insert(users)
        .values({
          username: data.username,
          email: data.email,
          fullName: data.fullName,
          displayName: data.displayName ?? null,
          passwordHash,
        })
        .returning()

      if (!user) throw new Error("Failed to create user")

      if (data.roleId) {
        await db.insert(userRoleAssignments).values({
          userId: user.id,
          roleId: data.roleId,
          locationId: data.locationId ?? null,
        })
      }

      return user
    } catch (error: any) {
      if (error.code === "23505") {
        throw new ConflictError("Username or email already exists")
      }
      throw error
    }
  }

  async updateUser(id: string, data: IamDto.UserUpdate) {
    const { roleId, locationId, password, ...userData } = data

    const updateValues: any = { ...userData }
    if (password) {
      updateValues.passwordHash = await hashPassword(password)
    }

    const [user] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, id))
      .returning()

    if (!user) throw new NotFoundError("User not found")

    if (roleId) {
      // Update or Insert assignment
      // For simplicity in this example, we clear and re-add or just add
      // Standard practice: check if exists, then update or delete old ones
      await db
        .delete(userRoleAssignments)
        .where(eq(userRoleAssignments.userId, id))
      await db.insert(userRoleAssignments).values({
        userId: id,
        roleId,
        locationId: locationId ?? null,
      })
    }

    return user
  }

  async deleteUser(id: string) {
    const [user] = await db.delete(users).where(eq(users.id, id)).returning()
    if (!user) throw new NotFoundError("User not found")
    return user
  }

  /**
   * ROLE
   */
  async getRoles(query: IamDto.RoleQuery) {
    const { page = 1, limit = 10, search } = query
    const offset = (page - 1) * limit

    const where = search ? ilike(roles.name, `%${search}%`) : undefined

    const [totalResult] = await db
      .select({ value: count() })
      .from(roles)
      .where(where)
    const total = Number(totalResult?.value ?? 0)

    const data = await db
      .select()
      .from(roles)
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(roles.createdAt))

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  async getRoleById(id: string) {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1)
    if (!role) throw new NotFoundError("Role not found")
    return role
  }

  async createRole(data: IamDto.RoleCreate) {
    try {
      const [role] = await db.insert(roles).values(data).returning()
      return role
    } catch (error: any) {
      if (error.code === "23505") {
        throw new ConflictError("Role code already exists")
      }
      throw error
    }
  }

  async updateRole(id: string, data: IamDto.RoleUpdate) {
    const [role] = await db
      .update(roles)
      .set(data)
      .where(eq(roles.id, id))
      .returning()
    if (!role) throw new NotFoundError("Role not found")
    return role
  }

  async deleteRole(id: string) {
    const [role] = await db.delete(roles).where(eq(roles.id, id)).returning()
    if (!role) throw new NotFoundError("Role not found")
    return role
  }
}

export const iamService = new IamService()
