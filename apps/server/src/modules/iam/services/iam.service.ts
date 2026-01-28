import { IamRepository } from "../repositories/iam.repository"
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from "@/core/errors/http.error"
import { hashPassword, verifyPassword } from "@/utils/password.util"
import { generateToken, type JwtPayload } from "@/utils/jwt.util"
import type {
  CreateUserDto,
  UpdateUserDto,
  UpdatePasswordDto,
  CreateRoleDto,
  UpdateRoleDto,
  CreateLocationDto,
  UpdateLocationDto,
  UserListQueryDto,
  RoleListQueryDto,
  LocationListQueryDto,
  LoginDto,
  LoginResponseDto,
} from "../dto/iam.dto"
import type { User, UserWithDetails, Role, Location } from "../types/iam.types"
import type { PaginatedResponse } from "@/shared/types"
import { calculatePaginationMeta } from "@/shared/dto"
import { PAGINATION } from "@/shared/constants"

/**
 * IAM Service
 * Contains all business logic for IAM operations
 */
export class IamService {
  private repository: IamRepository

  constructor() {
    this.repository = new IamRepository()
  }

  // ==========================================================================
  // Authentication
  // ==========================================================================

  /**
   * Login user
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.repository.findUserByUsername(dto.username)

    if (!user) {
      throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS")
    }

    if (!user.isActive) {
      throw new UnauthorizedError(
        "User account is inactive",
        "ACCOUNT_INACTIVE",
      )
    }

    if (user.isDeleted) {
      throw new UnauthorizedError(
        "User account has been deleted",
        "ACCOUNT_DELETED",
      )
    }

    const isPasswordValid = await verifyPassword(
      dto.password,
      user.passwordHash,
    )
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS")
    }

    // Update last login
    await this.repository.updateLastLogin(user.id)

    // Generate JWT token
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    }

    const token = generateToken(payload)

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        displayName: user.displayName,
      },
    }
  }

  // ==========================================================================
  // User Management
  // ==========================================================================

  /**
   * Get user by ID with full details
   */
  async getUserById(id: string): Promise<UserWithDetails> {
    const user = await this.repository.findUserWithDetails(id)

    if (!user) {
      throw new NotFoundError("User not found")
    }

    return user
  }

  /**
   * List users with filtering and pagination
   */
  async listUsers(query: UserListQueryDto): Promise<PaginatedResponse<User>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT

    const filter = {
      roleId: query.roleId,
      locationId: query.locationId,
      isActive: query.isActive,
      isDeleted: query.isDeleted ?? false, // Default exclude deleted users
      search: query.search,
    }

    const sort = query.sortBy
      ? { field: query.sortBy, order: query.sortOrder ?? "asc" }
      : undefined

    const { users, total } = await this.repository.listUsers(
      filter,
      { page, limit },
      sort,
    )

    const meta = calculatePaginationMeta(page, limit, total)

    return { data: users, meta }
  }

  /**
   * Create a new user
   */
  async createUser(dto: CreateUserDto): Promise<UserWithDetails> {
    // Check if username already exists
    const existingUsername = await this.repository.findUserByUsername(
      dto.username,
    )
    if (existingUsername) {
      throw new ConflictError("Username already exists")
    }

    // Check if email already exists
    const existingEmail = await this.repository.findUserByEmail(dto.email)
    if (existingEmail) {
      throw new ConflictError("Email already exists")
    }

    // Validate role IDs
    for (const assignment of dto.roleAssignments) {
      const role = await this.repository.findRoleById(assignment.roleId)
      if (!role) {
        throw new BadRequestError(`Role with ID ${assignment.roleId} not found`)
      }

      // Validate location if provided
      if (assignment.locationId) {
        const location = await this.repository.findLocationById(
          assignment.locationId,
        )
        if (!location) {
          throw new BadRequestError(
            `Location with ID ${assignment.locationId} not found`,
          )
        }
      }
    }

    // Hash password
    const passwordHash = await hashPassword(dto.password)

    // Create user
    const user = await this.repository.createUser({
      username: dto.username,
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      displayName: dto.displayName,
      isActive: dto.isActive,
      password: "",
    })

    // Assign roles
    await this.repository.assignRolesToUser(user.id, dto.roleAssignments)

    // Fetch and return user with details
    return this.getUserById(user.id)
  }

  /**
   * Update user
   */
  async updateUser(id: string, dto: UpdateUserDto): Promise<UserWithDetails> {
    const user = await this.repository.findUserById(id)
    if (!user) {
      throw new NotFoundError("User not found")
    }

    // Check email uniqueness if being updated
    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.repository.findUserByEmail(dto.email)
      if (existingEmail) {
        throw new ConflictError("Email already exists")
      }
    }

    // Validate role assignments if being updated
    if (dto.roleAssignments) {
      for (const assignment of dto.roleAssignments) {
        const role = await this.repository.findRoleById(assignment.roleId)
        if (!role) {
          throw new BadRequestError(
            `Role with ID ${assignment.roleId} not found`,
          )
        }

        if (assignment.locationId) {
          const location = await this.repository.findLocationById(
            assignment.locationId,
          )
          if (!location) {
            throw new BadRequestError(
              `Location with ID ${assignment.locationId} not found`,
            )
          }
        }
      }

      // Update role assignments
      await this.repository.clearUserRoleAssignments(id)
      await this.repository.assignRolesToUser(id, dto.roleAssignments)
    }

    // Update user fields
    await this.repository.updateUser(id, {
      email: dto.email,
      fullName: dto.fullName,
      displayName: dto.displayName,
      isActive: dto.isActive,
    })

    // Fetch and return updated user with details
    return this.getUserById(id)
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.repository.findUserById(id)
    if (!user) {
      throw new NotFoundError("User not found")
    }

    await this.repository.softDeleteUser(id)
  }

  /**
   * Update user password
   */
  async updateUserPassword(id: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.repository.findUserById(id)
    if (!user) {
      throw new NotFoundError("User not found")
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      dto.currentPassword,
      user.passwordHash,
    )
    if (!isCurrentPasswordValid) {
      throw new BadRequestError("Current password is incorrect")
    }

    // Hash new password
    const newPasswordHash = await hashPassword(dto.newPassword)

    // Update password
    await this.repository.updatePassword(id, newPasswordHash)
  }

  // ==========================================================================
  // Role Management
  // ==========================================================================

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role> {
    const role = await this.repository.findRoleById(id)
    if (!role) {
      throw new NotFoundError("Role not found")
    }
    return role
  }

  /**
   * List roles with filtering and pagination
   */
  async listRoles(query: RoleListQueryDto): Promise<PaginatedResponse<Role>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT

    const filter = {
      search: query.search,
    }

    const sort = query.sortBy
      ? { field: query.sortBy, order: query.sortOrder ?? "asc" }
      : undefined

    const { roles, total } = await this.repository.listRoles(
      filter,
      { page, limit },
      sort,
    )

    const meta = calculatePaginationMeta(page, limit, total)

    return { data: roles, meta }
  }

  /**
   * Create a new role
   */
  async createRole(dto: CreateRoleDto): Promise<Role> {
    // Check if role code already exists
    const existingRole = await this.repository.findRoleByCode(dto.code)
    if (existingRole) {
      throw new ConflictError("Role code already exists")
    }

    return this.repository.createRole(dto)
  }

  /**
   * Update role
   */
  async updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.repository.findRoleById(id)
    if (!role) {
      throw new NotFoundError("Role not found")
    }

    const updated = await this.repository.updateRole(id, dto)
    if (!updated) {
      throw new NotFoundError("Role not found")
    }

    return updated
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<void> {
    const role = await this.repository.findRoleById(id)
    if (!role) {
      throw new NotFoundError("Role not found")
    }

    await this.repository.deleteRole(id)
  }

  // ==========================================================================
  // Location Management
  // ==========================================================================

  /**
   * Get location by ID
   */
  async getLocationById(id: string): Promise<Location> {
    const location = await this.repository.findLocationById(id)
    if (!location) {
      throw new NotFoundError("Location not found")
    }
    return location
  }

  /**
   * List locations with filtering and pagination
   */
  async listLocations(
    query: LocationListQueryDto,
  ): Promise<PaginatedResponse<Location>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT

    const filter = {
      type: query.type,
      isActive: query.isActive,
      search: query.search,
    }

    const sort = query.sortBy
      ? { field: query.sortBy, order: query.sortOrder ?? "asc" }
      : undefined

    const { locations, total } = await this.repository.listLocations(
      filter,
      { page, limit },
      sort,
    )

    const meta = calculatePaginationMeta(page, limit, total)

    return { data: locations, meta }
  }

  /**
   * Create a new location
   */
  async createLocation(dto: CreateLocationDto): Promise<Location> {
    // Check if location code already exists
    const existingLocation = await this.repository.findLocationByCode(dto.code)
    if (existingLocation) {
      throw new ConflictError("Location code already exists")
    }

    return this.repository.createLocation(dto)
  }

  /**
   * Update location
   */
  async updateLocation(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.repository.findLocationById(id)
    if (!location) {
      throw new NotFoundError("Location not found")
    }

    const updated = await this.repository.updateLocation(id, dto)
    if (!updated) {
      throw new NotFoundError("Location not found")
    }

    return updated
  }

  /**
   * Delete location
   */
  async deleteLocation(id: string): Promise<void> {
    const location = await this.repository.findLocationById(id)
    if (!location) {
      throw new NotFoundError("Location not found")
    }

    await this.repository.deleteLocation(id)
  }
}
