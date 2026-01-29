import { z } from "zod"
import {
  paginationSchema,
  emailSchema,
  usernameSchema,
  passwordSchema,
  uuidSchema,
} from "@/core/shared/validators"

export namespace IamDto {
  /**
   * AUTH
   */
  export const Login = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  })
  export type Login = z.infer<typeof Login>

  export const Register = z.object({
    fullName: z.string().min(1, "Full name is required").max(255),
    email: emailSchema,
    password: passwordSchema,
  })
  export type Register = z.infer<typeof Register>

  /**
   * USER
   */
  export const UserQuery = paginationSchema.extend({
    search: z.string().optional(),
    roleId: uuidSchema.optional(),
    locationId: uuidSchema.optional(),
    isActive: z.coerce.boolean().optional(),
  })
  export type UserQuery = z.infer<typeof UserQuery>

  export const UserCreate = z.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    fullName: z.string().min(1).max(255),
    displayName: z.string().max(255).optional(),
    roleId: uuidSchema.optional(),
    locationId: uuidSchema.optional(),
  })
  export type UserCreate = z.infer<typeof UserCreate>

  export const UserUpdate = UserCreate.partial().omit({
    username: true,
  })
  export type UserUpdate = z.infer<typeof UserUpdate>

  /**
   * ROLE
   */
  export const RoleQuery = paginationSchema.extend({
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
   * RESPONSES (Generic wrappers are in shared/dto.ts)
   */
}
