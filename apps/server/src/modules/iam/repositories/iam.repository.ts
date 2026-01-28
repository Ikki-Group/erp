import { eq, and, like, or, sql, desc, asc, inArray } from "drizzle-orm"
import { db } from "@/db"
import { users, roles, userRoleAssignments, locations } from "@/db/schema"
import type {
  User,
  Role,
  Location,
  UserWithDetails,
  UserListFilter,
  RoleListFilter,
  LocationListFilter,
  RoleWithStats,
} from "../types/iam.types"
import type {
  CreateUserDto,
  CreateRoleDto,
  CreateLocationDto,
} from "../dto/iam.dto"
import type { PaginationParams, SortParams } from "@/shared/types"
import { PermissionChecker } from "@/core/rbac"

/**
 * IAM Repository
 * Handles all database operations for IAM module
 */
export class IamRepository {
  // ==========================================================================
  // User Queries
  // ==========================================================================

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return result[0] || null
  }

  /**
   * Find user by username
   */
  async findUserByUsername(username: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    return result[0] || null
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return result[0] || null
  }

  /**
   * Find user with full details (roles, permissions, locations)
   */
  async findUserWithDetails(id: string): Promise<UserWithDetails | null> {
    const user = await this.findUserById(id)
    if (!user) return null

    // Get user role assignments with role and location details
    const assignments = await db
      .select({
        roleId: roles.id,
        roleCode: roles.code,
        roleName: roles.name,
        locationId: locations.id,
        locationCode: locations.code,
        locationName: locations.name,
        permissions: roles.permissionCodes,
      })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
      .leftJoin(locations, eq(userRoleAssignments.locationId, locations.id))
      .where(eq(userRoleAssignments.userId, id))

    // Merge all permissions from all roles
    const allPermissions = assignments.map((a) => a.permissions)
    const userPermissions = PermissionChecker.mergePermissions(allPermissions)

    return {
      ...user,
      roles: assignments.map((a) => ({
        roleId: a.roleId,
        roleCode: a.roleCode,
        roleName: a.roleName,
        locationId: a.locationId,
        locationCode: a.locationCode,
        locationName: a.locationName,
        permissions: a.permissions,
      })),
      effectivePermissions: userPermissions.permissions,
      isSuperAdmin: userPermissions.isSuperAdmin,
    }
  }

  /**
   * List users with filters and pagination
   */
  async listUsers(
    filter: UserListFilter,
    pagination: PaginationParams,
    sort?: SortParams,
  ): Promise<{ users: User[]; total: number }> {
    const conditions = []

    if (filter.roleId) {
      // Need to join with userRoleAssignments to filter by role
      const userIdsWithRole = db
        .select({ userId: userRoleAssignments.userId })
        .from(userRoleAssignments)
        .where(eq(userRoleAssignments.roleId, filter.roleId))

      conditions.push(inArray(users.id, userIdsWithRole))
    }

    if (filter.locationId) {
      // Need to join with userRoleAssignments to filter by location
      const userIdsWithLocation = db
        .select({ userId: userRoleAssignments.userId })
        .from(userRoleAssignments)
        .where(eq(userRoleAssignments.locationId, filter.locationId))

      conditions.push(inArray(users.id, userIdsWithLocation))
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(users.isActive, filter.isActive))
    }

    if (filter.isDeleted !== undefined) {
      conditions.push(eq(users.isDeleted, filter.isDeleted))
    }

    if (filter.search) {
      conditions.push(
        or(
          like(users.username, `%${filter.search}%`),
          like(users.email, `%${filter.search}%`),
          like(users.fullName, `%${filter.search}%`),
        )!,
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause)

    const total = Number(countResult?.count ?? 0)

    // Get users with pagination
    const offset = (pagination.page - 1) * pagination.limit
    const orderBy = sort?.field
      ? sort.order === "desc"
        ? desc(users[sort.field as keyof typeof users])
        : asc(users[sort.field as keyof typeof users])
      : desc(users.createdAt)

    const userList = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pagination.limit)
      .offset(offset)

    return { users: userList, total }
  }

  /**
   * Create a new user
   */
  async createUser(
    data: Omit<CreateUserDto, "roleAssignments"> & { passwordHash: string },
  ): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        displayName: data.displayName,
        isActive: data.isActive,
      })
      .returning()

    return user
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    return user || null
  }

  /**
   * Soft delete user
   */
  async softDeleteUser(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
      })
      .where(eq(users.id, id))
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id))
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id))
  }

  // ==========================================================================
  // Role Queries
  // ==========================================================================

  /**
   * Find role by ID
   */
  async findRoleById(id: string): Promise<Role | null> {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1)
    return role || null
  }

  /**
   * Find role by code
   */
  async findRoleByCode(code: string): Promise<Role | null> {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.code, code))
      .limit(1)
    return role || null
  }

  /**
   * List roles with filters and pagination
   */
  async listRoles(
    filter: RoleListFilter,
    pagination: PaginationParams,
    sort?: SortParams,
  ): Promise<{ roles: RoleWithStats[]; total: number }> {
    const conditions = []

    if (filter.search) {
      conditions.push(
        or(
          like(roles.code, `%${filter.search}%`),
          like(roles.name, `%${filter.search}%`),
        )!,
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(roles)
      .where(whereClause)

    const total = Number(countResult?.count ?? 0)

    // Get roles with user count
    const offset = (pagination.page - 1) * pagination.limit
    const orderBy = sort?.field
      ? sort.order === "desc"
        ? desc(roles[sort.field as keyof typeof roles])
        : asc(roles[sort.field as keyof typeof roles])
      : desc(roles.createdAt)

    const roleList = await db
      .select({
        id: roles.id,
        code: roles.code,
        name: roles.name,
        description: roles.description,
        permissionCodes: roles.permissionCodes,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
        userCount: sql<number>`count(distinct ${userRoleAssignments.userId})`,
      })
      .from(roles)
      .leftJoin(userRoleAssignments, eq(roles.id, userRoleAssignments.roleId))
      .where(whereClause)
      .groupBy(roles.id)
      .orderBy(orderBy)
      .limit(pagination.limit)
      .offset(offset)

    return {
      roles: roleList.map((r) => ({
        ...r,
        userCount: Number(r.userCount ?? 0),
      })),
      total,
    }
  }

  /**
   * Create a new role
   */
  async createRole(data: CreateRoleDto): Promise<Role> {
    const [role] = await db.insert(roles).values(data).returning()
    return role
  }

  /**
   * Update role
   */
  async updateRole(id: string, data: Partial<Role>): Promise<Role | null> {
    const [role] = await db
      .update(roles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning()

    return role || null
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id))
  }

  // ==========================================================================
  // User Role Assignment Queries
  // ==========================================================================

  /**
   * Assign roles to user
   */
  async assignRolesToUser(
    userId: string,
    assignments: Array<{ roleId: string; locationId?: string }>,
  ): Promise<void> {
    if (assignments.length === 0) return

    await db.insert(userRoleAssignments).values(
      assignments.map((a) => ({
        userId,
        roleId: a.roleId,
        locationId: a.locationId || null,
      })),
    )
  }

  /**
   * Clear all role assignments for a user
   */
  async clearUserRoleAssignments(userId: string): Promise<void> {
    await db
      .delete(userRoleAssignments)
      .where(eq(userRoleAssignments.userId, userId))
  }

  // ==========================================================================
  // Location Queries
  // ==========================================================================

  /**
   * Find location by ID
   */
  async findLocationById(id: string): Promise<Location | null> {
    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, id))
      .limit(1)
    return location || null
  }

  /**
   * Find location by code
   */
  async findLocationByCode(code: string): Promise<Location | null> {
    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.code, code))
      .limit(1)
    return location || null
  }

  /**
   * List locations with filters and pagination
   */
  async listLocations(
    filter: LocationListFilter,
    pagination: PaginationParams,
    sort?: SortParams,
  ): Promise<{ locations: Location[]; total: number }> {
    const conditions = []

    if (filter.type) {
      conditions.push(eq(locations.type, filter.type))
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(locations.isActive, filter.isActive))
    }

    if (filter.search) {
      conditions.push(
        or(
          like(locations.code, `%${filter.search}%`),
          like(locations.name, `%${filter.search}%`),
        )!,
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(locations)
      .where(whereClause)

    const total = Number(countResult?.count ?? 0)

    // Get locations with pagination
    const offset = (pagination.page - 1) * pagination.limit
    const orderBy = sort?.field
      ? sort.order === "desc"
        ? desc(locations[sort.field as keyof typeof locations])
        : asc(locations[sort.field as keyof typeof locations])
      : desc(locations.createdAt)

    const locationList = await db
      .select()
      .from(locations)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pagination.limit)
      .offset(offset)

    return { locations: locationList, total }
  }

  /**
   * Create a new location
   */
  async createLocation(data: CreateLocationDto): Promise<Location> {
    const [location] = await db.insert(locations).values(data).returning()
    return location
  }

  /**
   * Update location
   */
  async updateLocation(
    id: string,
    data: Partial<Location>,
  ): Promise<Location | null> {
    const [location] = await db
      .update(locations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(locations.id, id))
      .returning()

    return location || null
  }

  /**
   * Delete location
   */
  async deleteLocation(id: string): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id))
  }
}
