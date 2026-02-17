import { queryOptions } from '@tanstack/react-query'
import { ApiError } from './api-error'

export function apiFactory<
  TParams extends Record<string, unknown> | void,
  TResponse,
>({
  keys,
  fn,
}: {
  keys: readonly string[]
  fn: (params: TParams) => Promise<TResponse>
}) {
  const executedFn = (params: TParams) => fetchWrapper(fn(params))

  return {
    qry: (params: TParams) =>
      queryOptions({
        queryKey: [...keys, params] as const,
        queryFn: () => executedFn(params),
      }),
    fn: executedFn,
    $infer: {
      params: {} as TParams,
      response: {} as TResponse,
    },
  }
}

async function fetchWrapper<TResponse>(fetcher: Promise<TResponse>) {
  try {
    return await fetcher
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof Error) {
      throw new ApiError(error.message)
    }

    throw new ApiError('An unknown error occurred')
  }
}

export type InferParams<T extends { $infer: { params: unknown } }> =
  T['$infer']['params']

export type InferResponse<T extends { $infer: { response: unknown } }> =
  T['$infer']['response']

export function unwrapEdenResult<T extends { data: any; error: any }>(
  res: T,
): NonNullable<T['data']> {
  if (res.error) {
    const errorValue = res.error.value
    const errorMessage =
      typeof errorValue === 'object' &&
      errorValue !== null &&
      'message' in errorValue
        ? String(errorValue.message)
        : JSON.stringify(errorValue)

    throw new ApiError(errorMessage || 'An unknown error occurred')
  }

  if (res.data === null || res.data === undefined) {
    throw new ApiError('Response data is empty')
  }

  return res.data as NonNullable<T['data']>
}

export async function edenWrapper<T extends { data: any; error: any }>(
  res: Promise<T>,
) {
  const data = await res
  return unwrapEdenResult(data)
}
