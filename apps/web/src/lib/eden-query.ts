import { type QueryKey, queryOptions } from '@tanstack/react-query'

export class EdenError<T = any> extends Error {
  constructor(
    public status: number,
    public value: T,
  ) {
    super(JSON.stringify(value))
  }
}

export function edenQuery<
  const TParams,
  TResponse extends { data: any; error: any },
  TData = TResponse extends { data: infer D; error: null } ? D : never,
  TError = TResponse extends { data: null; error: { value: infer E } }
    ? E
    : TResponse extends { data: null; error: infer E }
      ? E
      : unknown,
>(key: QueryKey, fetcher: (params: TParams) => Promise<TResponse>) {
  return (params: TParams) =>
    queryOptions<TData, EdenError<TError>>({
      queryKey: [...key, params],
      queryFn: async () => {
        const { data, error } = await fetcher(params)
        if (error) {
          const err = error as any
          throw new EdenError(err.status, err.value ?? err)
        }
        return data as TData
      },
    })
}
