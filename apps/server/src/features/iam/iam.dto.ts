import { z } from 'zod'

import { zh } from '@/shared/zod'

import { UserEntity } from './iam.types'

export namespace IamDto {
  /**
   * AUTH
   */
  export const Login = z.object({
    email: zh.email,
    password: zh.password,
  })
  export type Login = z.infer<typeof Login>

  export const Register = z.object({
    fullName: z.string().min(1, 'Full name is required').max(255),
    email: zh.email,
    password: zh.password,
  })
  export type Register = z.infer<typeof Register>

  /**
   * USER
   */
  export const UserQuery = zh.pagination.extend({
    search: z.string().optional(),
    roleId: zh.uuid.optional(),
    locationId: zh.uuid.optional(),
    isActive: z.coerce.boolean().optional(),
  })
  export type UserQuery = z.infer<typeof UserQuery>

  export const UserCreate = z.object({
    username: zh.username,
    email: zh.email,
    password: zh.password,
    fullName: z.string().min(1).max(255),
    displayName: z.string().max(255).optional(),
    roleId: zh.uuid.optional(),
    locationId: zh.uuid.optional(),
  })
  export type UserCreate = z.infer<typeof UserCreate>

  export const UserUpdate = UserCreate.partial().omit({
    username: true,
  })
  export type UserUpdate = z.infer<typeof UserUpdate>

  /**
   * ROLE
   */
  export const RoleQuery = zh.pagination.extend({
    search: z.string().optional(),
  })
  export type RoleQuery = z.infer<typeof RoleQuery>

  export const RoleCreate = z.object({
    code: z.string().min(1).max(100),
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    permissionCodes: z.array(z.string()).default([]),
  })
  export type RoleCreate = z.infer<typeof RoleCreate>

  export const RoleUpdate = RoleCreate.partial()
  export type RoleUpdate = z.infer<typeof RoleUpdate>

  /**
   * RESPONSES
   */
  export const AuthResponse = z.object({
    token: z.string(),
    user: UserEntity,
  })
  export type AuthResponse = z.infer<typeof AuthResponse>
}
