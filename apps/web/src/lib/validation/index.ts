export { zp } from './primitive'
export { zc } from './common'
export { zq } from './query'

export * from './common'
export * from './response'

/* -------------------------------------------------------------------------- */
/*  Named re-exports (migrated from @/lib/zod)                                */
/*  These aliases let consumers switch from `@/lib/zod` to `@/lib/validation` */
/*  without changing any usage code — only the import path.                    */
/* -------------------------------------------------------------------------- */

import { zc } from './common'
import { zp } from './primitive'
import { zq } from './query'

export const zStr = zp.str
export const zStrNullable = zp.strNullable
export const zNum = zp.num
export const zNumCoerce = zp.numCoerce
export const zDate = zp.date
export const zBool = zp.bool
export const zBoolCoerce = zp.boolCoerce
export const zId = zp.id
export const zUuid = zp.uuid
export const zDecimal = zp.decimal

export const zEmail = zc.email
export const zPassword = zc.password
export const zUsername = zc.username
export const zRecordIdDto = zc.RecordId
export const zPaginationMetaDto = zc.PaginationMeta
export const zMetadataDto = zc.AuditFull

export const zQueryId = zq.id
export const zQueryIds = zq.ids
export const zQuerySearch = zq.search
export const zQueryBoolean = zq.boolean
export const zPaginationDto = zq.pagination
