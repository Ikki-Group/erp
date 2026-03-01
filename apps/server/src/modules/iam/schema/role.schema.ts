// import z from 'zod'

// import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

// /* --------------------------------- ENTITY --------------------------------- */

// export const RoleDto = z.object({
//   id: zPrimitive.num,
//   code: zPrimitive.str,
//   name: zPrimitive.str,
//   isSystem: zPrimitive.bool,
//   ...zSchema.meta.shape,
// })

// export type RoleDto = z.infer<typeof RoleDto>

// /* --------------------------------- FILTER --------------------------------- */

// export const RoleFilterDto = z.object({
//   search: zHttp.query.search,
//   isSystem: zHttp.query.boolean,
// })

// export type RoleFilterDto = z.infer<typeof RoleFilterDto>

// /* --------------------------------- MUTATION --------------------------------- */

// export const RoleCreateDto = z.object({
//   code: zPrimitive.codeUpper,
//   name: zPrimitive.str,
//   isSystem: zPrimitive.bool.optional().default(false),
// })

// export type RoleCreateDto = z.infer<typeof RoleCreateDto>

// export const RoleUpdateDto = z.object({
//   ...zSchema.recordId.shape,
//   ...RoleCreateDto.shape,
// })

// export type RoleUpdateDto = z.infer<typeof RoleUpdateDto>
