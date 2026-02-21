import z from 'zod'

import { zSchema } from '@/lib/zod'

export const RoleDto = z.object({
  id: z.number(),
  code: z.string().transform((val) => val.toUpperCase().trim()),
  name: z.string(),
  isSystem: z.boolean(),
  ...zSchema.meta.shape,
})

export type RoleDto = z.infer<typeof RoleDto>

export const RoleMutationDto = z.object({
  ...RoleDto.pick({
    code: true,
    name: true,
    isSystem: true,
  }).partial({
    isSystem: true,
  }).shape,
})

export type RoleMutationDto = z.infer<typeof RoleMutationDto>

export const UserDto = z.object({
  id: zSchema.num,
  email: zSchema.email,
  username: zSchema.username,
  fullname: zSchema.str,
  isRoot: zSchema.bool,
  isActive: zSchema.bool,
  ...zSchema.meta.shape,
})

export type UserDto = z.infer<typeof UserDto>

export const UserCreateDto = z.object({
  ...UserDto.pick({
    email: true,
    username: true,
    fullname: true,
    isActive: true,
    isRoot: true,
  }).shape,
  password: zSchema.password,
  access: z
    .array(
      z.object({
        locationId: zSchema.num,
        roleId: zSchema.num,
      })
    )
    .optional()
    .default([]),
})

export type UserCreateDto = z.infer<typeof UserCreateDto>

export const UserUpdateDto = z.object({
  id: zSchema.num,
  ...UserCreateDto.omit({ password: true }).shape,
})

export type UserUpdateDto = z.infer<typeof UserUpdateDto>
