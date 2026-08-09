import { z } from 'zod'

import { createPaginatedResponseSchema, createSuccessResponseSchema, zc } from '@/lib/validation/index.ts'

import { defineMutation, defineQuery } from './endpoint.ts'
import type { ApiClient } from './client.ts'
import type { HttpMethod, QueryKey } from './types.ts'
import type { ZodType } from 'zod'

type IdLike = string | number | boolean | null | undefined

/** Reads `.id` off an object arg, or `null` when the arg isn't an object with an `id`. */
function extractId(value: unknown): IdLike {
	if (value && typeof value === 'object' && 'id' in value) {
		return (value as { id: IdLike }).id
	}
	return null
}

export interface ResourceUrls {
	list: string
	detail: string
	create: string
	update: string
	remove: string
}

export interface DefineResourceConfig<
	TEntity extends ZodType,
	TFilter extends ZodType | undefined,
	TCreate extends ZodType,
	TUpdate extends ZodType,
	TId extends ZodType,
> {
	urls: ResourceUrls
	/** Schema describing a single entity record, used for `list`/`detail` responses. */
	entitySchema: TEntity
	/** Schema for `list` query/filter params. Omit for resources with no filtering. */
	filter?: TFilter
	/** Schema for the `create` request body. */
	create: TCreate
	/** Schema for the `update` request body. */
	update: TUpdate
	/** Schema for the id used by `detail`/`remove` query params. Defaults to `zc.RecordId`. */
	id?: TId
	client?: ApiClient
	/**
	 * HTTP method used for `remove`. Defaults to `'delete'`, but some endpoints
	 * perform a delete-like mutation over `post`.
	 */
	removeMethod?: HttpMethod
}

/**
 * CRUD sugar built on top of `defineQuery`/`defineMutation`. Wires up
 * `list`/`detail`/`create`/`update`/`remove` following the server's actual
 * conventions.
 */
export function defineResource<
	TEntity extends ZodType,
	TFilter extends ZodType | undefined,
	TCreate extends ZodType,
	TUpdate extends ZodType,
	TId extends ZodType = typeof zc.RecordId,
>(config: DefineResourceConfig<TEntity, TFilter, TCreate, TUpdate, TId>) {
	const { urls, entitySchema, filter, create, update, client } = config
	const id = (config.id ?? zc.RecordId) as TId
	const removeMethod = config.removeMethod ?? 'delete'

	const keys = {
		lists: (): QueryKey => [urls.list],
		list: (query?: unknown): QueryKey => [urls.list, query ?? null],
		details: (): QueryKey => [urls.detail],
		detail: (query?: unknown): QueryKey => [urls.detail, query ?? null],
	}

	const list = defineQuery({
		method: 'get',
		url: urls.list,
		query: filter,
		result: createPaginatedResponseSchema(entitySchema),
		queryKey: (query) => keys.list(query),
		client,
	})

	const detail = defineQuery({
		method: 'get',
		url: urls.detail,
		query: id,
		result: createSuccessResponseSchema(entitySchema),
		queryKey: (query) => keys.detail(query),
		client,
	})

	const createEndpoint = defineMutation({
		method: 'post',
		url: urls.create,
		body: create,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [keys.lists()],
		client,
	})

	const updateEndpoint = defineMutation({
		method: 'put',
		url: urls.update,
		body: update,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [keys.lists(), (args) => keys.detail({ id: extractId(args) })],
		client,
	})

	const remove = defineMutation({
		method: removeMethod,
		url: urls.remove,
		query: id,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [keys.lists()],
		client,
	})

	return {
		keys,
		list,
		detail,
		create: createEndpoint,
		update: updateEndpoint,
		remove,
	}
}

export { z }
