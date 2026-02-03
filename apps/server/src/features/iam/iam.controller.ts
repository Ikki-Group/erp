import { Elysia, t } from 'elysia'

import { paginatedResponse, successResponse } from '@/shared/responses'

import { IamDto } from './iam.dto'
import { iamService } from './iam.service'

const authController = new Elysia({
  prefix: '/auth',
  detail: { tags: ['iam.auth'] },
})
  .post(
    '/login',
    async ({ body }) => {
      const result = await iamService.login(body)
      return successResponse(result, 'Login successful')
    },
    { body: IamDto.Login }
  )
  .post(
    '/register',
    async ({ body }) => {
      const user = await iamService.register(body)
      return successResponse(user, 'User registered successfully')
    },
    { body: IamDto.Register }
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
    { query: IamDto.UserQuery }
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
    { body: IamDto.UserCreate }
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
    { query: IamDto.RoleQuery }
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
    { body: IamDto.RoleCreate }
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
    }
  )

/**
 * IAM Controller
 * Main controller that combines all IAM-related endpoints
 */
export const iamController = new Elysia({ prefix: '/iam' })
  //
  .use(authController)
  .use(userController)
  .use(roleController)
