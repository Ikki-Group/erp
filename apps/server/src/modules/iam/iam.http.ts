import { Elysia, t } from "elysia"
import { iamService } from "./iam.service"
import { IamDto } from "./iam.dto"
import { successResponse, paginatedResponse } from "@/core/shared/dto"

const authHttp = new Elysia({ prefix: "/auth", detail: { tags: ["Auth"] } })
  /**
   * Login by email and password
   */
  .post(
    "/login",
    async ({ body }) => {
      const result = await iamService.login(body)
      return successResponse(result, "Login successful")
    },
    {
      body: IamDto.Login,
      detail: {
        summary: "Login user",
        description: "Authenticate user and return JWT token",
      },
    },
  )
  /**
   * Register new user
   */
  .post(
    "/register",
    async ({ body }) => {
      const user = await iamService.register(body)
      return successResponse(user, "User registered successfully")
    },
    {
      body: IamDto.Register,
      detail: {
        summary: "Register new user",
      },
    },
  )

const userHttp = new Elysia({ prefix: "/user", detail: { tags: ["Users"] } })
  /**
   * Get all users
   */
  .get(
    "",
    async ({ query }) => {
      const result = await iamService.getUsers(query)
      return paginatedResponse(result.data, result.meta)
    },
    {
      query: IamDto.UserQuery,
      detail: {
        summary: "Get all users",
        description: "Fetch paginated users with search and filter",
      },
    },
  )

  /**
   * Get user by id
   */
  .get(
    "/:id",
    async ({ params: { id } }) => {
      const user = await iamService.getUserById(id)
      return successResponse(user)
    },
    {
      detail: {
        summary: "Get user by ID",
      },
    },
  )

  /**
   * Create new user
   */
  .post(
    "",
    async ({ body }) => {
      const user = await iamService.createUser(body)
      return successResponse(user, "User created successfully")
    },
    {
      body: IamDto.UserCreate,
      detail: {
        summary: "Create new user",
      },
    },
  )

  /**
   * Update user by id
   */
  .put(
    "/:id",
    async ({ params: { id }, body }) => {
      const user = await iamService.updateUser(id, body)
      return successResponse(user, "User updated successfully")
    },
    {
      body: IamDto.UserUpdate,
      detail: {
        summary: "Update user by ID",
      },
    },
  )

  /**
   * Delete user by id
   */
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      const user = await iamService.deleteUser(id)
      return successResponse(user, "User deleted successfully")
    },
    {
      detail: {
        summary: "Delete user by ID",
      },
    },
  )

const roleHttp = new Elysia({ prefix: "/role", detail: { tags: ["Roles"] } })
  /**
   * Get all roles
   */
  .get(
    "",
    async ({ query }) => {
      const result = await iamService.getRoles(query)
      return paginatedResponse(result.data, result.meta)
    },
    {
      query: IamDto.RoleQuery,
      detail: {
        summary: "Get all roles",
      },
    },
  )

  /**
   * Get role by id
   */
  .get(
    "/:id",
    async ({ params: { id } }) => {
      const role = await iamService.getRoleById(id)
      return successResponse(role)
    },
    {
      detail: {
        summary: "Get role by ID",
      },
    },
  )

  /**
   * Create new role
   */
  .post(
    "",
    async ({ body }) => {
      const role = await iamService.createRole(body)
      return successResponse(role, "Role created successfully")
    },
    {
      body: IamDto.RoleCreate,
      detail: {
        summary: "Create new role",
      },
    },
  )

  /**
   * Update role by id
   */
  .put(
    "/:id",
    async ({ params: { id }, body }) => {
      const role = await iamService.updateRole(id, body)
      return successResponse(role, "Role updated successfully")
    },
    {
      body: IamDto.RoleUpdate,
      detail: {
        summary: "Update role by ID",
      },
    },
  )

  /**
   * Delete role by id
   */
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      const role = await iamService.deleteRole(id)
      return successResponse(role, "Role deleted successfully")
    },
    {
      detail: {
        summary: "Delete role by ID",
      },
    },
  )

export const iamHttp = new Elysia({ prefix: "/iam" })
  .use(authHttp)
  .use(userHttp)
  .use(roleHttp)
