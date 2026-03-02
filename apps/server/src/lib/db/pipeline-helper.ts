import type { PipelineStage } from 'mongoose'

import type { DB_NAME } from '@/config/db-name'

const DEFAULT_UNSET_FIELDS = ['_id', '__v']

export const pipelineHelper = {
  /** Match documents by MongoDB `_id`. */
  $matchId: (id: ObjectId) => ({ $match: { _id: id } }),

  /** Generic `$match` stage. */
  $match: ($match: PipelineStage.Match['$match']) => ({ $match }),

  /** Renames `_id` to `id` (or applies a custom `$set`). Defaults to `{ id: '$_id' }`. */
  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  $setId: ($set: PipelineStage.Set['$set'] = { id: '$_id' }) => ({ $set }),

  /** Add computed or static fields to documents. */
  $addFields: ($addFields: PipelineStage.AddFields['$addFields']) => ({ $addFields }),

  /** Remove fields from documents. Defaults to removing `_id` and `__v`. */
  $unset: ($unset: PipelineStage.Unset['$unset'] = DEFAULT_UNSET_FIELDS) => ({ $unset }),

  /** Sort documents. Defaults to `{ updatedAt: -1 }`. */
  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  $sort: ($sort: PipelineStage.Sort['$sort'] = { updatedAt: -1 }) => ({ $sort }),

  /** Project only the listed fields (excluding `_id` by default). */
  $project: (...keys: string[]) => ({
    $project: {
      _id: 0,
      ...Object.fromEntries(keys.map((key) => [key, 1])),
    },
  }),

  /** Unwind an array field. Optionally preserve null and empty arrays. */
  $unwind: (path: string, preserveNullAndEmptyArrays = false) => ({
    $unwind: { path, preserveNullAndEmptyArrays },
  }),

  /** Replace the root document with a nested field. */
  $replaceRoot: (newRoot: PipelineStage.ReplaceRoot['$replaceRoot']['newRoot']) => ({
    $replaceRoot: { newRoot },
  }),

  /** Group documents by `_id` expression with optional accumulators. */
  $group: ($group: PipelineStage.Group['$group']) => ({ $group }),

  /**
   * Standardized `$lookup`.
   * Supports both simple (field-based) and correlated (pipeline + `let`) joins.
   */
  $lookup: ({
    from,
    localField,
    foreignField,
    as,
    pipeline = [],
    let: letVars,
  }: {
    from: DB_NAME | (string & {})
    as: string
    localField?: string
    foreignField?: string
    let?: PipelineStage.Lookup['$lookup']['let']
    pipeline?: Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>[]
  }): PipelineStage.Lookup => ({
    $lookup: { from, localField, foreignField, as, pipeline, let: letVars },
  }),
}
