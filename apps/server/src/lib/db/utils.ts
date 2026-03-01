import { isObjectIdOrHexString, Types } from 'mongoose'

export function tryParseObjectId(id: unknown): ObjectId | null {
  if (isObjectIdOrHexString(id)) return new Types.ObjectId(id as string)
  return null
}
