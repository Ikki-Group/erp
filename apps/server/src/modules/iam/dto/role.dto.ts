import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

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
  id: zPrimitive.num,
  email: zPrimitive.email,
  username: zPrimitive.username,
  fullname: zPrimitive.str,
  isRoot: zPrimitive.bool,
  isActive: zPrimitive.bool,
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
  password: zPrimitive.password,
  access: z
    .array(
      z.object({
        locationId: zPrimitive.num,
        roleId: zPrimitive.num,
      })
    )
    .optional()
    .default([]),
})

export type UserCreateDto = z.infer<typeof UserCreateDto>

export const UserUpdateDto = z.object({
  id: zPrimitive.num,
  ...UserCreateDto.omit({ password: true }).shape,
})

export type UserUpdateDto = z.infer<typeof UserUpdateDto>

export const RoleFilterInputDto = z.object({
  search: z.string().optional(),
  isSystem: z.boolean().optional(),
})

export type RoleFilterInputDto = z.infer<typeof RoleFilterInputDto>
