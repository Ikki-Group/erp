import { Elysia, t } from "elysia"
import { IamService } from "../services/iam.service"
import { successResponse, paginatedResponse } from "@/shared/dto"
import { PERMISSIONS, ALL_PERMISSIONS, PERMISSION_GROUPS } from "@/core/rbac"
import {
  createUserSchema,
  updateUserSchema,
  updatePasswordSchema,
  userListQuerySchema,
  createRoleSchema,
  updateRoleSchema,
  roleListQuerySchema,
  createLocationSchema,
  updateLocationSchema,
  locationListQuerySchema,
  loginSchema,
} from "../dto/iam.dto"

/**
 * IAM Controller
 * Defines all API routes for IAM module
 */
export const iamController = new Elysia({ prefix: "/api/iam" })
  .decorate("iamService", new IamService())

  // ==========================================================================
  // Authentication Routes
  // ==========================================================================

  .post(
    "/auth/login",
    async ({ body, iamService }) => {
      const result = await iamService.login(body)
      return successResponse(result, "Login successful")
    },
    {
      body: loginSchema,
      detail: {
        tags: ["Authentication"],
        summary: "Login user",
        description: "Authenticate user and return JWT token",
      },
    },
  )

  // ==========================================================================
  // User Routes
  // ==========================================================================

  .get(
    "/users",
    async ({ query, iamService }) => {
      const validated = userListQuerySchema.parse(query)
      const result = await iamService.listUsers(validated)
      return paginatedResponse(result.data, result.meta)
    },
    {
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        sortBy: t.Optional(t.String()),
        sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
        roleId: t.Optional(t.String()),
        locationId: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        isDeleted: t.Optional(t.Boolean()),
        search: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Users"],
        summary: "List users",
        description:
          "Get paginated list of users with filtering by role, location, status, and search query",
      },
    },
  )

  .get(
    "/users/:id",
    async ({ params, iamService }) => {
      const user = await iamService.getUserById(params.id)
      return successResponse(user)
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Users"],
        summary: "Get user details",
        description:
          "Get user by ID with full details including roles, permissions, and locations",
      },
    },
  )

  .post(
    "/users",
    async ({ body, iamService }) => {
      const user = await iamService.createUser(body)
      return successResponse(user, "User created successfully")
    },
    {
      body: createUserSchema,
      detail: {
        tags: ["Users"],
        summary: "Create user",
        description: "Create a new user with role and location assignments",
      },
    },
  )

  .patch(
    "/users/:id",
    async ({ params, body, iamService }) => {
      const user = await iamService.updateUser(params.id, body)
      return successResponse(user, "User updated successfully")
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: updateUserSchema,
      detail: {
        tags: ["Users"],
        summary: "Update user",
        description: "Update user information including roles and locations",
      },
    },
  )

  .delete(
    "/users/:id",
    async ({ params, iamService }) => {
      await iamService.deleteUser(params.id)
      return successResponse(null, "User deleted successfully")
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Users"],
        summary: "Delete user",
        description: "Soft delete user (user will be marked as deleted)",
      },
    },
  )

  .patch(
    "/users/:id/password",
    async ({ params, body, iamService }) => {
      await iamService.updateUserPassword(params.id, body)
      return successResponse(null, "Password updated successfully")
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: updatePasswordSchema,
      detail: {
        tags: ["Users"],
        summary: "Update user password",
        description:
          "Update user password (requires current password verification)",
      },
    },
  )

  // ==========================================================================
  // Role Routes
  // ==========================================================================

  .get(
    "/roles",
    async ({ query, iamService }) => {
      const validated = roleListQuerySchema.parse(query)
      const result = await iamService.listRoles(validated)
      return paginatedResponse(result.data, result.meta)
    },
    {
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        sortBy: t.Optional(t.String()),
        sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
        search: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Roles"],
        summary: "List roles",
        description: "Get paginated list of roles with search filtering",
      },
    },
  )

  .get(
    "/roles/:id",
    async ({ params, iamService }) => {
      const role = await iamService.getRoleById(params.id)
      return successResponse(role)
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Roles"],
        summary: "Get role details",
        description: "Get role by ID with permissions",
      },
    },
  )

  .post(
    "/roles",
    async ({ body, iamService }) => {
      const role = await iamService.createRole(body)
      return successResponse(role, "Role created successfully")
    },
    {
      body: createRoleSchema,
      detail: {
        tags: ["Roles"],
        summary: "Create role",
        description: "Create a new role with permissions",
      },
    },
  )

  .patch(
    "/roles/:id",
    async ({ params, body, iamService }) => {
      const role = await iamService.updateRole(params.id, body)
      return successResponse(role, "Role updated successfully")
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: updateRoleSchema,
      detail: {
        tags: ["Roles"],
        summary: "Update role",
        description: "Update role information and permissions",
      },
    },
  )

  .delete(
    "/roles/:id",
    async ({ params, iamService }) => {
      await iamService.deleteRole(params.id)
      return successResponse(null, "Role deleted successfully")
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Roles"],
        summary: "Delete role",
        description: "Delete role (hard delete)",
      },
    },
  )

  // ==========================================================================
  // Permission Routes
  // ==========================================================================

  .get(
    "/permissions",
    () => {
      return successResponse({
        all: ALL_PERMISSIONS,
        groups: PERMISSION_GROUPS,
        structure: PERMISSIONS,
      })
    },
    {
      detail: {
        tags: ["Permissions"],
        summary: "List all permissions",
        description:
          "Get all available permissions grouped by module and resource",
      },
    },
  )

  .get(
    "/users/:id/permissions",
    async ({ params, iamService }) => {
      const user = await iamService.getUserById(params.id)
      return successResponse({
        effectivePermissions: user.effectivePermissions,
        isSuperAdmin: user.isSuperAdmin,
        rolePermissions: user.roles.map((r) => ({
          roleId: r.roleId,
          roleCode: r.roleCode,
          roleName: r.roleName,
          locationId: r.locationId,
          locationCode: r.locationCode,
          locationName: r.locationName,
          permissions: r.permissions,
        })),
      })
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Permissions"],
        summary: "Get user permissions",
        description:
          "Get effective permissions for a user (merged from all assigned roles)",
      },
    },
  )

  // ==========================================================================
  // Location Routes
  // ==========================================================================

  .get(
    "/locations",
    async ({ query, iamService }) => {
      const validated = locationListQuerySchema.parse(query)
      const result = await iamService.listLocations(validated)
      return paginatedResponse(result.data, result.meta)
    },
    {
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        sortBy: t.Optional(t.String()),
        sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
        type: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        search: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Locations"],
        summary: "List locations",
        description:
          "Get paginated list of locations with filtering by type, status, and search query",
      },
    },
  )

  .get(
    "/locations/:id",
    async ({ params, iamService }) => {
      const location = await iamService.getLocationById(params.id)
      return successResponse(location)
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Locations"],
        summary: "Get location details",
        description: "Get location by ID",
      },
    },
  )

  .post(
    "/locations",
    async ({ body, iamService }) => {
      const location = await iamService.createLocation(body)
      return successResponse(location, "Location created successfully")
    },
    {
      body: createLocationSchema,
      detail: {
        tags: ["Locations"],
        summary: "Create location",
        description: "Create a new location",
      },
    },
  )

  .patch(
    "/locations/:id",
    async ({ params, body, iamService }) => {
      const location = await iamService.updateLocation(params.id, body)
      return successResponse(location, "Location updated successfully")
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: updateLocationSchema,
      detail: {
        tags: ["Locations"],
        summary: "Update location",
        description: "Update location information",
      },
    },
  )

  .delete(
    "/locations/:id",
    async ({ params, iamService }) => {
      await iamService.deleteLocation(params.id)
      return successResponse(null, "Location deleted successfully")
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Locations"],
        summary: "Delete location",
        description: "Delete location (hard delete)",
      },
    },
  )
