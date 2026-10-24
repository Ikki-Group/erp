import { z } from 'zod'

import { createPaginatedResponseSchema, createSuccessResponseSchema } from '@/lib/validation'
import { zc } from '@/lib/validation'

import { createQueryKeys } from './core/query-keys'
import { defineEndpoint } from './define-endpoint'
import type { KyInstance } from 'ky'
import type { ZodType } from 'zod'

type IdLike = string | number | boolean | null | undefined

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
	feature: string
	entity: string
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
	client?: KyInstance
}

/**
 * CRUD sugar built on top of `defineEndpoint`. Wires up `list`/`detail`/
 * `create`/`update`/`remove` following the server's actual conventions:
 * `list`/`detail`/`remove` read the id/filter from the QUERY string
 * (GET/DELETE), while `create`/`update` send data in the BODY (POST/PUT).
 *
 * Query-key invalidation is pre-wired for the common cases:
 *   - `create`/`remove` invalidate the `list` query key.
 *   - `update` invalidates both `list` and the specific `detail` entry
 *     (resolved from `body.id`, when present).
 *
 * Returns each endpoint alongside the shared `keys` builder so callers can
 * invalidate/read cache manually when needed (e.g. from an unrelated
 * mutation elsewhere in the app).
 */
export function defineResource<
	TEntity extends ZodType,
	TFilter extends ZodType | undefined,
	TCreate extends ZodType,
	TUpdate extends ZodType,
	TId extends ZodType = typeof zc.RecordId,
>(config: DefineResourceConfig<TEntity, TFilter, TCreate, TUpdate, TId>) {
	const { feature, entity, urls, entitySchema, filter, create, update, client } = config
	const id = (config.id ?? zc.RecordId) as TId

	const keys = createQueryKeys(feature, entity)

	const list = defineEndpoint({
		method: 'get',
		url: urls.list,
		query: filter,
		result: createPaginatedResponseSchema(entitySchema),
		queryKey: (query) => keys.list(query),
		client,
	})

	const detail = defineEndpoint({
		method: 'get',
		url: urls.detail,
		query: id,
		result: createSuccessResponseSchema(entitySchema),
		queryKey: (query) => keys.detail(extractId(query)),
		client,
	})

	const createEndpoint = defineEndpoint({
		method: 'post',
		url: urls.create,
		body: create,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [keys.lists()],
		client,
	})

	const updateEndpoint = defineEndpoint({
		method: 'put',
		url: urls.update,
		body: update,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [keys.lists(), (args) => keys.detail(extractId(args.body))],
		client,
	})

	const remove = defineEndpoint({
		method: 'delete',
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
