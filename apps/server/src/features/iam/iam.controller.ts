import { Elysia, t } from 'elysia'

import { ErrorResponseSchema } from '@/shared/errors/http.error'
import {
  createPaginatedResponseSchema,
  createSuccessResponseSchema,
  paginatedResponse,
  successResponse,
} from '@/shared/responses'

import { IamDto } from './iam.dto'
import { RoleEntity, UserEntity } from './iam.schema'
import { iamService } from './iam.service'

/**
 * Authentication Controller
 * Handles user authentication and registration
 */
const authController = new Elysia({
  prefix: '/auth',
  detail: { tags: ['IAM - Authentication'] },
})
  /**
   * Login by email and password
   */
  .post(
    '/login',
    async ({ body }) => {
      const result = await iamService.login(body)
      return successResponse(result, 'Login successful')
    },
    {
      body: IamDto.Login,
      response: {
        200: createSuccessResponseSchema(IamDto.AuthResponse),
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      detail: {
        summary: 'User login',
        description: 'Authenticate user with email and password, returns JWT token and user information',
      },
    }
  )
  /**
   * Register new user
   */
  .post(
    '/register',
    async ({ body }) => {
      const user = await iamService.register(body)
      return successResponse(user, 'User registered successfully')
    },
    {
      body: IamDto.Register,
      response: {
        200: createSuccessResponseSchema(UserEntity),
        400: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      detail: {
        summary: 'Register new user',
        description: 'Create a new user account with email and password',
      },
    }
  )

/**
 * User Management Controller
 * Handles CRUD operations for users
 */
const userController = new Elysia({
  prefix: '/user',
  detail: { tags: ['IAM - User Management'] },
})
  /**
   * Get all users with pagination and filters
   */
  .get(
    '',
    async ({ query }) => {
      const result = await iamService.getUsers(query)
      return paginatedResponse(result.data, result.meta)
    },
    {
      query: IamDto.UserQuery,
      response: {
        200: createPaginatedResponseSchema(UserEntity),
        400: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      detail: {
        summary: 'Get all users',
        description: 'Fetch paginated list of users with optional search and filter parameters',
      },
    }
  )

  /**
   * Get user by ID
   */
  .get(
    '/:id',
    async ({ params: { id } }) => {
      const user = await iamService.getUserById(id)
      return successResponse(user)
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'User ID' }),
      }),
      response: {
        200: createSuccessResponseSchema(UserEntity),
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      detail: {
        summary: 'Get user by ID',
        description: 'Retrieve detailed information about a specific user',
      },
    }
  )

  /**
   * Create new user
   */
  .post(
    '',
    async ({ body }) => {
      const user = await iamService.createUser(body)
      return successResponse(user, 'User created successfully')
    },
    {
      body: IamDto.UserCreate,
      response: {
        200: createSuccessResponseSchema(UserEntity),
        400: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      detail: {
        summary: 'Create new user',
        description: 'Create a new user with role assignment',
      },
    }
  )

  /**
   * Update user by ID
   */
  .put(
    '/:id',
    async ({ params: { id }, body }) => {
      const user = await iamService.updateUser(id, body)
      return successResponse(user, 'User updated successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'User ID' }),
      }),
      body: IamDto.UserUpdate,
      response: {
        200: createSuccessResponseSchema(UserEntity),
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      detail: {
        summary: 'Update user by ID',
        description: 'Update user information and role assignments',
      },
    }
  )

  /**
   * Delete user by ID
   */
  .delete(
    '/:id',
    async ({ params: { id } }) => {
      const user = await iamService.deleteUser(id)
      return successResponse(user, 'User deleted successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'User ID' }),
      }),
      response: {
        200: createSuccessResponseSchema(UserEntity),
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      detail: {
        summary: 'Delete user by ID',
        description: 'Permanently delete a user from the system',
      },
    }
  )

/**
 * Role Management Controller
 * Handles CRUD operations for roles
 */
const roleController = new Elysia({
  prefix: '/role',
  detail: { tags: ['IAM - Role Management'] },
})
  /**
   * Get all roles with pagination
   */
  .get(
    '',
    async ({ query }) => {
      const result = await iamService.getRoles(query)
      return paginatedResponse(result.data, result.meta)
    },
    {
      query: IamDto.RoleQuery,
      response: {
        200: createPaginatedResponseSchema(RoleEntity),
        400: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      detail: {
        summary: 'Get all roles',
        description: 'Fetch paginated list of roles with optional search',
      },
    }
  )

  /**
   * Get role by ID
   */
  .get(
    '/:id',
    async ({ params: { id } }) => {
      const role = await iamService.getRoleById(id)
      return successResponse(role)
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Role ID' }),
      }),
      response: {
        200: createSuccessResponseSchema(RoleEntity),
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      detail: {
        summary: 'Get role by ID',
        description: 'Retrieve detailed information about a specific role',
      },
    }
  )

  /**
   * Create new role
   */
  .post(
    '',
    async ({ body }) => {
      const role = await iamService.createRole(body)
      return successResponse(role, 'Role created successfully')
    },
    {
      body: IamDto.RoleCreate,
      response: {
        200: createSuccessResponseSchema(RoleEntity),
        400: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      detail: {
        summary: 'Create new role',
        description: 'Create a new role with permissions',
      },
    }
  )

  /**
   * Update role by ID
   */
  .put(
    '/:id',
    async ({ params: { id }, body }) => {
      const role = await iamService.updateRole(id, body)
      return successResponse(role, 'Role updated successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Role ID' }),
      }),
      body: IamDto.RoleUpdate,
      response: {
        200: createSuccessResponseSchema(RoleEntity),
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      detail: {
        summary: 'Update role by ID',
        description: 'Update role information and permissions',
      },
    }
  )

  /**
   * Delete role by ID
   */
  .delete(
    '/:id',
    async ({ params: { id } }) => {
      const role = await iamService.deleteRole(id)
      return successResponse(role, 'Role deleted successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Role ID' }),
      }),
      response: {
        200: createSuccessResponseSchema(RoleEntity),
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      detail: {
        summary: 'Delete role by ID',
        description: 'Permanently delete a role from the system',
      },
    }
  )

/**
 * IAM Controller
 * Main controller that combines all IAM-related endpoints
 */
export const iamController = new Elysia({ prefix: '/iam' }).use(authController).use(userController).use(roleController)
