import type { Model, PipelineStage } from 'mongoose'
import type { ZodError, ZodType } from 'zod'

import type { PaginationMeta, PaginationQuery } from '@/lib/pagination'

type OptionalStage = PipelineStage | null | undefined | false
type FacetStage = PipelineStage.FacetPipelineStage

interface ExecOptions<TResult> {
  schema?: ZodType<TResult>
}

interface ExecPaginatedOptions<TResult> extends ExecOptions<TResult> {
  pq: PaginationQuery
  /** Stages injected inside $facet's data branch, before $skip/$limit */
  facetBefore?: FacetStage[]
  /** Stages injected inside $facet's data branch, after $skip/$limit */
  facetAfter?: FacetStage[]
}

export interface PaginatedResult<TData> {
  data: TData
  meta: PaginationMeta
}

export class AggregationValidationError extends Error {
  constructor(
    public readonly pipeline: readonly PipelineStage[],
    public readonly zodError: ZodError
  ) {
    super('Aggregation validation failed')
    this.name = 'AggregationValidationError'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class PipelineBuilder<TModel = any> {
  readonly #model: Model<TModel>
  readonly #stages: readonly PipelineStage[]

  private constructor(model: Model<TModel>, stages: readonly PipelineStage[]) {
    this.#model = model
    this.#stages = stages
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static create<TModel = any>(model: Model<TModel>) {
    return new PipelineBuilder<TModel>(model, [])
  }

  /** Returns a new PipelineBuilder with the appended stages (immutable). Falsy stages are ignored. */
  push(...stages: OptionalStage[]): PipelineBuilder<TModel> {
    const next = stages.filter<PipelineStage>(Boolean)
    return new PipelineBuilder<TModel>(this.#model, [...this.#stages, ...next])
  }

  /** Returns the accumulated pipeline stages. */
  build(): PipelineStage[] {
    return [...this.#stages]
  }

  /** Logs the current pipeline for debugging. No-ops in production. */
  debug(label = 'AggregationPipeline'): this {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug(`[${label}]`, JSON.stringify(this.#stages, null, 2))
    }
    return this
  }

  async #parseResult<TResult>(raw: unknown, schema: ZodType<TResult>): Promise<TResult> {
    const parsed = await schema.safeParseAsync(raw)
    if (!parsed.success) throw new AggregationValidationError([...this.#stages], parsed.error)
    return parsed.data
  }

  /** Executes the pipeline and returns all results. */
  async exec<TResult = unknown[]>({ schema }: ExecOptions<TResult> = {}): Promise<TResult> {
    const raw = await this.#model.aggregate([...this.#stages])
    return schema ? this.#parseResult(raw, schema) : (raw as TResult)
  }

  /** Executes the pipeline and returns the first result, or null. Automatically appends `$limit: 1`. */
  async execOne<TResult = unknown>({ schema }: ExecOptions<TResult> = {}): Promise<TResult | null> {
    const [raw] = await this.#model.aggregate([...this.#stages, { $limit: 1 }])
    if (!raw) return null
    return schema ? this.#parseResult(raw, schema) : (raw as TResult)
  }

  /** Executes the pipeline with `$facet`-based pagination. Returns data + PaginationMeta. */
  async execPaginated<TResult = unknown[]>({
    schema,
    pq,
    facetBefore = [],
    facetAfter = [],
  }: ExecPaginatedOptions<TResult>): Promise<PaginatedResult<TResult>> {
    const page = Math.max(1, pq.page)
    const limit = Math.max(1, pq.limit)
    const skip = (page - 1) * limit

    const pipeline: PipelineStage[] = [
      ...this.#stages,
      {
        $facet: {
          data: [...facetBefore, { $skip: skip }, { $limit: limit }, ...facetAfter],
          meta: [{ $count: 'total' }],
        },
      },
    ]

    const [result] = await this.#model.aggregate(pipeline)

    const rawData = result?.data ?? []
    const total: number = result?.meta?.[0]?.total ?? 0
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
