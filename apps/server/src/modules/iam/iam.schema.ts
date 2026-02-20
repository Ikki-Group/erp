import z from 'zod'

import { zSchema } from '@/lib/zod'

export namespace IamSchema {
  export const User = z.object({
    id: zSchema.num,
    email: zSchema.email,
    username: zSchema.username,
    fullname: zSchema.str,
    isRoot: zSchema.bool,
    isActive: zSchema.bool,
    ...zSchema.meta.shape,
  })

  export type User = z.infer<typeof User>

  export const Role = z.object({
    id: zSchema.num,
    code: zSchema.str,
    name: zSchema.str,
    isSystem: zSchema.bool,
    ...zSchema.meta.shape,
  })

  export type Role = z.infer<typeof Role>

  export const UserRoleAssignment = z.object({
    id: zSchema.num,
    userId: zSchema.num,
    roleId: zSchema.num,
    locationId: zSchema.num,
    assignedAt: zSchema.date,
    assignedBy: zSchema.num,
  })

  export type UserRoleAssignment = z.infer<typeof UserRoleAssignment>

  export const UserRoleAssignmentDetail = UserRoleAssignment.extend({
    role: Role.nullable(),
    location: z
      .object({
        id: zSchema.num,
        code: zSchema.str,
        name: zSchema.str,
      })
      .nullable(),
  })

  export type UserRoleAssignmentDetail = z.infer<typeof UserRoleAssignmentDetail>

  export const UserWithAccess = User.extend({
    locations: z.array(
      z.object({
        id: zSchema.num.meta({}),
        code: zSchema.str,
        name: zSchema.str,
        role: z.string(),
      })
    ),
  })

  export type UserWithAccess = z.infer<typeof UserWithAccess>

  export const AuthResponse = z.object({
    user: UserWithAccess,
    token: z.string(),
  })

  export type AuthResponse = z.infer<typeof AuthResponse>

  export const UserCreateDto = z.object({
    email: zSchema.email,
    fullname: zSchema.str.min(3, 'Nama minimal 3 karakter'),
    username: zSchema.username.min(3, 'Username minimal 3 karakter'),
    password: zSchema.password.min(3, 'Password minimal 3 karakter'),
    isRoot: zSchema.bool,
    isActive: zSchema.bool,
    roles: z.array(
      z.object({
        locationId: zSchema.num.nullable(),
        roleId: zSchema.num,
      })
    ),
  })

  export type UserCreateDto = z.infer<typeof UserCreateDto>

  export const UserUpdateDto = z.object({
    id: zSchema.num,
    email: zSchema.email.optional(),
    fullname: zSchema.str.min(3, 'Nama minimal 3 karakter').optional(),
    username: zSchema.username.min(3, 'Username minimal 3 karakter').optional(),
    password: zSchema.password.min(3, 'Password minimal 3 karakter').optional(),
    isRoot: zSchema.bool.optional(),
    isActive: zSchema.bool.optional(),
    roles: z
      .array(
        z.object({
          locationId: zSchema.num.nullable(),
          roleId: zSchema.num,
        })
      )
      .optional(),
  })

  export type UserUpdateDto = z.infer<typeof UserUpdateDto>
}
