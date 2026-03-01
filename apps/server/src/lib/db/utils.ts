import { isObjectIdOrHexString, Types, type HydratedDocument, type InferSchemaType, type PipelineStage } from 'mongoose'

import type { DB_NAME } from '@/config/db-name'

type Hydrated<Schema> = HydratedDocument<InferSchemaType<Schema>>
type HydratedSchema<Schema> = InferSchemaType<Schema>

const DEFAULT_UNSET_FIELDS = ['_id', '__v']

export const pipelineHelper = {
  /** Match by MongoDB _id */
  $matchId: (id: ObjectId) => ({ $match: { _id: id } }),

  $match: ($match: PipelineStage.Match['$match']) => ({ $match }),

  /** Set a normalized `id` field (default maps to _id) */
  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  $setId: ($set: PipelineStage.Set['$set'] = { id: '$_id' }) => ({ $set }),

  /** Remove default or custom fields */
  $unset: ($unset: PipelineStage.Unset['$unset'] = DEFAULT_UNSET_FIELDS) => ({
    $unset,
  }),

  /** Default sort by updatedAt (descending) */
  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  $sort: ($sort: PipelineStage.Sort['$sort'] = { updatedAt: -1 }) => ({
    $sort,
  }),

  /** Project only selected fields (excluding _id by default) */
  $project: (...keys: string[]) => ({
    $project: {
      _id: 0,
      ...Object.fromEntries(keys.map((key) => [key, 1])),
    },
  }),

  /** Unwind arrays with optional preservation */
  $unwind: (path: string, preserveNullAndEmptyArrays = false) => ({
    $unwind: { path, preserveNullAndEmptyArrays },
  }),

  /** Standardized $lookup (common pattern) */
  $lookup: ({
    from,
    localField,
    foreignField,
    as,
    pipeline = [],
  }: {
    from: DB_NAME | (string & {})
    localField: string
    foreignField: string
    as: string
    pipeline?: Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>[]
  }): PipelineStage.Lookup => ({
    $lookup: { from, localField, foreignField, as, pipeline },
  }),
}

export function tryParseObjectId(id: unknown): Types.ObjectId | null {
  if (typeof id === 'string' && isObjectIdOrHexString(id)) {
    return new Types.ObjectId(id)
  }

  if (id instanceof Types.ObjectId) {
    return id
  }

  return null
}
