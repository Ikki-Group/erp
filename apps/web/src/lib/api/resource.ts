import { z } from 'zod'

import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
} from '@/lib/validation/index.ts'

import type { ApiClient } from './client.ts'
import { defineMutation, defineQuery } from './endpoint.ts'
import type { FreshnessTier } from './freshness.ts'
import { createResourceKeys } from './resource-keys.ts'
import type { HttpMethod } from './types.ts'
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
	/** Feature namespace for the canonical query keys (e.g. `'location'`, `'inventory'`). */
	feature: string
	/** Resource namespace for the canonical query keys (e.g. `'location'`, `'stock'`). */
	resource: string
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
	/** Freshness tier for `list`/`detail` reads. Defaults to `'standard'`. */
	tier?: FreshnessTier
	/**
	 * When true, this resource's data is scoped to the active location: the
	 * active `locationId` is folded into every key so the cache partitions per
	 * location, and location-switch invalidation targets these keys precisely.
	 */
	locationScoped?: boolean
}

/**
 * CRUD sugar built on top of `defineQuery`/`defineMutation`. Wires up
 * `list`/`detail`/`create`/`update`/`remove` following the server's actual
 * conventions, keyed through the canonical `createResourceKeys` factory.
 *
 * `defineResource` deliberately stays CRUD-only. A resource that needs extra
 * endpoints (`void`, `ship`, `active`, …) composes them at the feature level by
 * spreading the returned bundle and adding hand-written `defineQuery`/
 * `defineMutation` that reuse the exported `keys` — no config-callback plugin
 * surface here.
 */
export function defineResource<
	TEntity extends ZodType,
	TFilter extends ZodType | undefined,
	TCreate extends ZodType,
	TUpdate extends ZodType,
	TId extends ZodType = typeof zc.RecordId,
>(config: DefineResourceConfig<TEntity, TFilter, TCreate, TUpdate, TId>) {
	const { feature, resource, urls, entitySchema, filter, create, update, client } = config
	const id = (config.id ?? zc.RecordId) as TId
	const removeMethod = config.removeMethod ?? 'delete'
	const tier = config.tier ?? 'standard'
	const locationScoped = config.locationScoped ?? false

	const keys = createResourceKeys(feature, resource, { locationScoped })

	const list = defineQuery({
		method: 'get',
		url: urls.list,
		query: filter,
		result: createPaginatedResponseSchema(entitySchema),
		queryKey: (query) => keys.list(query),
		tier,
		client,
	})

	const detail = defineQuery({
		method: 'get',
		url: urls.detail,
		query: id,
		result: createSuccessResponseSchema(entitySchema),
		queryKey: (query) => keys.detail(query),
		tier,
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
