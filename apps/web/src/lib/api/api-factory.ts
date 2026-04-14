import { queryOptions } from '@tanstack/react-query'
import { HTTPError } from 'ky'
import type { KyInstance } from 'ky'
import { treeifyError } from 'zod'
import type { ZodType, z } from 'zod'

import { apiClient } from './api-client'
import { ApiError } from './api-error'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export interface TErr<T = any> {
	code: string | number
	message: string
	data: T
	trace: unknown
}

interface ApiFactoryConfig<
	TParams extends ZodType | undefined,
	TBody extends ZodType | undefined,
	TResult extends ZodType,
> {
	method: HttpMethod
	url: string
	keys?: ReadonlyArray<string>
	params?: TParams
	body?: TBody
	result: TResult
	client?: KyInstance
}
/* ----------------------------------------
 * Type Utilities
 * --------------------------------------*/
type IsDefined<T> = T extends undefined ? false : true
type Input<T> = T extends ZodType ? z.input<T> : never
type Output<T> = T extends ZodType ? z.output<T> : never

type FetchArgs<TParams, TBody> =
	IsDefined<TParams> extends true
		? IsDefined<TBody> extends true
			? { params: Input<TParams>; body: Input<TBody> }
			: { params: Input<TParams> }
		: IsDefined<TBody> extends true
			? { body: Input<TBody> }
			: undefined

export function apiFactory<
	TParams extends ZodType | undefined,
	TBody extends ZodType | undefined,
	TResult extends ZodType,
>({ client = apiClient, keys = [], ...config }: ApiFactoryConfig<TParams, TBody, TResult>) {
	type Args = FetchArgs<TParams, TBody>
	type Result = Output<TResult>
	type Params = Input<TParams>

	/* ----------------------------------------
	 * fetch
	 * --------------------------------------*/
	const fetch = async (args: Args): Promise<Result> => {
		try {
			let params = (args as any)?.params
			let body = (args as any)?.body

			if (config.params) params = config.params.parse(params)
			if (config.body) body = config.body.parse(body)

			const resultRaw = await client(config.url, {
				method: config.method,
				searchParams: params,
				json: body,
			})

			const resultJson = await resultRaw.json()
			const parsedResult = config.result.safeParse(resultJson)
			if (parsedResult.error) {
				const msg = `[ZodError] ${config.url}
Response:
${JSON.stringify(resultJson, null, 2)}
========
${JSON.stringify(treeifyError(parsedResult.error), null, 2)}
`
				throw new Error(msg)
			}

			return parsedResult.data as Result
		} catch (error) {
			/**
			 * Handle HTTP errors
			 * if the response is JSON, parse it and throw an ApiError
			 */
			if (
				error instanceof HTTPError &&
				error.response.headers.get('content-type')?.includes('application/json')
			) {
				const data = await error.response.json<TErr>()
				throw new ApiError(data.message, error.response.status, data)
			}

			throw error
		}
	}

	/* ----------------------------------------
	 * React Query helpers
	 * --------------------------------------*/
	const queryKey = (params: Params | undefined) => [config.url, ...keys, params ?? null] as const

	const query = (params: Params | undefined) =>
		queryOptions({
			queryKey: queryKey(params),
			queryFn: () => fetch((config.params ? { params } : undefined) as Args),
		} as const)

	const mutationFn = (args: Args) => fetch(args)

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
	}
}
