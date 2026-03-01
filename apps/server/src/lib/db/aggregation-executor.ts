import type { ClientSession, Model, PipelineStage } from 'mongoose'
import type { ZodError, ZodType } from 'zod'

export class AggregationValidationError extends Error {
  constructor(
    public readonly pipeline: readonly PipelineStage[],
    public readonly zodError: ZodError
  ) {
    super('Aggregation validation failed')
  }
}

interface ExecOptions<TResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>
  pipeline: PipelineStage[]
  schema?: ZodType<TResult>
  session?: ClientSession
}

export async function executeAggregation<TResult = unknown[]>({
  model,
  pipeline,
  schema,
  session,
}: ExecOptions<TResult>): Promise<TResult> {
  const raw = await model.aggregate(pipeline, { session })

  if (!schema) {
    return raw as TResult
  }

  const parsed = schema.safeParse(raw)

  if (!parsed.success) {
    throw new AggregationValidationError(pipeline, parsed.error)
  }

  return parsed.data
}

export async function executeAggregationOne<TResult = unknown>({
  model,
  pipeline,
  schema,
  session,
}: ExecOptions<TResult>): Promise<TResult | null> {
  const limitedPipeline = [...pipeline, { $limit: 1 }]

  const [raw] = await model.aggregate(limitedPipeline, { session })

  if (!raw) return null

  if (!schema) {
    return raw as TResult
  }

  const parsed = schema.safeParse(raw)

  if (!parsed.success) {
    throw new AggregationValidationError(limitedPipeline, parsed.error)
  }

  return parsed.data
}
