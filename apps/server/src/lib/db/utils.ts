import { isObjectIdOrHexString, Types } from 'mongoose'

import { BadRequestError } from '@/lib/error/http'

/** Returns an ObjectId if valid, otherwise null. Safe for optional cases. */
export function tryParseObjectId(id: unknown): Types.ObjectId | null {
  if (id instanceof Types.ObjectId) return id
  if (typeof id === 'string' && isObjectIdOrHexString(id)) return new Types.ObjectId(id)
  return null
}

/** Parses an ObjectId or throws a ValidationError. Use in service layer for required IDs. */
export function parseObjectId(id: unknown, errorCode = 'INVALID_OBJECT_ID'): Types.ObjectId {
  const result = tryParseObjectId(id)
  if (!result) throw new BadRequestError('Invalid or missing ObjectId', errorCode)
  return result
}

/** Type guard for ObjectId instances. */
export function isObjectId(value: unknown): value is Types.ObjectId {
  return value instanceof Types.ObjectId
}

/** Converts a string or ObjectId to ObjectId. Alias for tryParseObjectId with a non-null assertion for pre-validated inputs. */
export function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return id instanceof Types.ObjectId ? id : new Types.ObjectId(id)
}
