export { zp } from './primitive'
export { zc } from './common'
export { zq } from './query'

export * from './common'
export * from './response'

// Backward compatibility (deprecated - use zp, zc, zq instead)
import { zp } from './primitive'
import { zc } from './common'
import { zq } from './query'

/** @deprecated use zp.id */
export const zId = zp.id
/** @deprecated use zp.str */
export const zStr = zp.str
/** @deprecated use zp.strNullable */
export const zStrNullable = zp.strNullable
/** @deprecated use zp.num */
export const zNum = zp.num
/** @deprecated use zp.bool */
export const zBool = zp.bool
/** @deprecated use zp.date */
export const zDate = zp.date
/** @deprecated use zp.decimal */
export const zDecimal = zp.decimal
/** @deprecated use zq.search */
export const zQuerySearch = zq.search
/** @deprecated use zc.RecordId */
export const zRecordIdDto = zc.RecordId
/** @deprecated use zc.AuditBasic */
export const zMetadataDto = zc.AuditBasic
