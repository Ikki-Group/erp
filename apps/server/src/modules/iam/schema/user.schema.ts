// import z from 'zod'

// import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

// import { LocationDto } from '@/modules/location'

// import { RoleDto } from './role.schema'

// /* --------------------------------- ENTITY --------------------------------- */

// export const UserDto = z.object({
//   id: zPrimitive.num,
//   email: zPrimitive.email,
//   username: zPrimitive.username,
//   fullname: zPrimitive.str,
//   isRoot: zPrimitive.bool,
//   isActive: zPrimitive.bool,
//   ...zSchema.meta.shape,
// })

// export type UserDto = z.infer<typeof UserDto>

// export const UserAssignmentDto = z.object({
//   userId: zPrimitive.num,
//   roleId: zPrimitive.num,
//   locationId: zPrimitive.num,
//   isDefault: zPrimitive.bool,
// })

// export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>

// /* --------------------------------- FILTER --------------------------------- */

// export const UserFilterDto = z.object({
//   search: zHttp.query.search,
//   isRoot: zHttp.query.boolean,
//   isActive: zHttp.query.boolean,
// })

// export type UserFilterDto = z.infer<typeof UserFilterDto>

// /* --------------------------------- MUTATION --------------------------------- */

// export const UserAssignedInputDto = z.object({
//   locationId: zPrimitive.num,
//   roleId: zPrimitive.num,
//   isDefault: zPrimitive.bool,
// })

// export type UserAssignedInputDto = z.infer<typeof UserAssignedInputDto>

// export const UserCreateDto = z.object({
//   ...UserDto.pick({
//     email: true,
//     username: true,
//     fullname: true,
//     isActive: true,
//     isRoot: true,
//   }).shape,
//   password: zPrimitive.password,
//   assignments: z.array(UserAssignedInputDto),
// })

// export type UserCreateDto = z.infer<typeof UserCreateDto>

// export const UserUpdateDto = z.object({
//   id: zPrimitive.num,
//   ...UserCreateDto.omit({ password: true }).shape,
// })

// export type UserUpdateDto = z.infer<typeof UserUpdateDto>

// /* -------------------------------- COMPOSED -------------------------------- */

// export const UserDetailAssignmentDto = z.object({
//   isDefault: zPrimitive.bool,
//   role: RoleDto.pick({ id: true, name: true, code: true }),
//   location: LocationDto,
// })

// export type UserDetailAssignmentDto = z.infer<typeof UserDetailAssignmentDto>

// export const UserDetailDto = z.object({
//   ...UserDto.shape,
//   assignments: z.array(UserDetailAssignmentDto),
// })

// export type UserDetailDto = z.infer<typeof UserDetailDto>
