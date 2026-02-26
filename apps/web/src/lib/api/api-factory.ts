import type { KyInstance } from "ky";
import { queryOptions } from "@tanstack/react-query";
import { z, ZodType } from "zod";
import { apiClient } from "./api-client";

type HttpMethod = "get" | "post" | "put" | "delete";

interface ApiFactoryConfig<
  TParams extends ZodType | undefined,
  TBody extends ZodType | undefined,
  TResult extends ZodType,
> {
  method: HttpMethod;
  url: string;
  keys?: readonly string[];
  params?: TParams;
  body?: TBody;
  result: TResult;
  client?: KyInstance;
}
/* ----------------------------------------
 * Type Utilities
 * --------------------------------------*/
type IsDefined<T> = T extends undefined ? false : true;
type Input<T> = T extends ZodType ? z.input<T> : never;
type Output<T> = T extends ZodType ? z.output<T> : never;

type FetchArgs<P, B> =
  IsDefined<P> extends true
    ? IsDefined<B> extends true
      ? { params: Input<P>; body: Input<B> }
      : { params: Input<P> }
    : IsDefined<B> extends true
      ? { body: Input<B> }
      : undefined;

export function apiFactory<
  TParams extends ZodType | undefined,
  TBody extends ZodType | undefined,
  TResult extends ZodType,
>({ client = apiClient, keys = [], ...config }: ApiFactoryConfig<TParams, TBody, TResult>) {
  type Args = FetchArgs<TParams, TBody>;
  type Result = Output<TResult>;
  type Params = Input<TParams>;

  /* ----------------------------------------
   * fetch
   * --------------------------------------*/
  const fetch = async (args: Args): Promise<Result> => {
    let params = (args as any)?.params;
    let body = (args as any)?.body;

    if (config.params) params = config.params.parse(params);
    if (config.body) body = config.body.parse(body);

    const res = await client(config.url, {
      method: config.method,
      searchParams: params,
      json: body,
    }).json();

    return config.result.parse(res) as Result;
  };

  /* ----------------------------------------
   * React Query helpers
   * --------------------------------------*/
  const queryKey = (params: Params | undefined) => [config.url, ...keys, params ?? null] as const;

  const query = (params: Params | undefined) =>
    queryOptions({
      queryKey: queryKey(params),
      queryFn: () => fetch((config.params ? { params } : undefined) as Args),
    } as const);

  const mutationFn = (args: Args) => fetch(args);

  return {
    fetch,
    query,
    queryKey,
    mutationFn,

    /* ----------------------------------------
     * Inference helpers (DX)
     * --------------------------------------*/
    _types: {
      params: null as unknown as Params,
      result: null as unknown as Result,
      args: null as unknown as Args,
    },
  };
}
