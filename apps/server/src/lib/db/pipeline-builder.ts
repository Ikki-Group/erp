import type { Model, PipelineStage } from 'mongoose'
import type { ZodError, ZodType } from 'zod'

import { type PaginationMeta, type PaginationQuery } from '@/lib/pagination'

type OptionalStage = PipelineStage | null | undefined
type FacetStage = PipelineStage.FacetPipelineStage

interface ExecOptions<TResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>
  schema?: ZodType<TResult>
}

export class AggregationValidationError extends Error {
  constructor(
    public readonly pipeline: readonly PipelineStage[],
    public readonly zodError: ZodError
  ) {
    super('Aggregation validation failed')
  }
}

// eslint-disable-next-line unicorn/prefer-native-coercion-functions
function isStage(stage: OptionalStage): stage is PipelineStage {
  return Boolean(stage)
}

export class PipelineBuilder {
  private stages: PipelineStage[]

  private constructor(stages: PipelineStage[]) {
    this.stages = stages
  }

  static create() {
    return new PipelineBuilder([])
  }

  push(...stages: OptionalStage[]) {
    const next = stages.filter<PipelineStage>((element) => isStage(element))
    this.stages.push(...next)
    return this
  }

  build(): PipelineStage[] {
    return this.stages
  }

  debug(label = 'Aggregation Pipeline') {
    // eslint-disable-next-line no-console
    console.debug({ label, pipeline: this.stages })
    return this
  }

  async #parseResult<TResult>(raw: unknown, schema: ZodType<TResult>): Promise<TResult> {
    const parsed = await schema.safeParseAsync(raw)

    if (!parsed.success) {
      throw new AggregationValidationError(this.stages, parsed.error)
    }

    return parsed.data
  }

  async exec<TResult = unknown[]>({ model, schema }: ExecOptions<TResult>): Promise<TResult> {
    const raw = await model.aggregate(this.stages)
    return schema ? this.#parseResult(raw, schema) : (raw as TResult)
  }

  async execOne<TResult = unknown>({ model, schema }: ExecOptions<TResult>): Promise<TResult | null> {
    const limitedPipeline = [...this.stages, { $limit: 1 }]
    const [raw] = await model.aggregate(limitedPipeline)
    if (!raw) return null
    return schema ? this.#parseResult(raw, schema) : raw
  }

  async execPaginated<TResult = unknown[]>({
    model,
    schema,
    pq,
    facetBefore = [],
    facetAfter = [],
  }: ExecOptions<TResult> & {
    pq: PaginationQuery
    facetBefore?: FacetStage[]
    facetAfter?: FacetStage[]
  }): Promise<{
    data: TResult
    meta: PaginationMeta
  }> {
    const page = Math.max(1, pq.page)
    const limit = Math.max(1, pq.limit)
    const skip = (page - 1) * limit

    const paginatedPipeline: PipelineStage[] = [
      ...this.stages,
      {
        $facet: {
          data: [...facetBefore, { $skip: skip }, { $limit: limit }, ...facetAfter],
          meta: [{ $count: 'total' }],
        },
      },
    ]

    const [result] = await model.aggregate(paginatedPipeline)

    const rawData = result?.data ?? []
    const total = result?.meta?.[0]?.total ?? 0

    const data = schema ? await this.#parseResult(rawData, schema) : (rawData as TResult)

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}
