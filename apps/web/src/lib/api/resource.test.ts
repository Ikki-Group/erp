import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { setActiveLocationAccessor } from './active-location.ts'
import { defineResource } from './resource.ts'

const entity = z.object({ id: z.number(), name: z.string() })
const filter = z.object({ page: z.number().optional() })
const create = z.object({ name: z.string() })
const update = z.object({ id: z.number(), name: z.string() })

const urls = {
	list: 'location/list',
	detail: 'location/detail',
	create: 'location/create',
	update: 'location/update',
	remove: 'location/remove',
}

afterEach(() => {
	setActiveLocationAccessor(() => null)
})

describe('defineResource — CRUD-only surface', () => {
	const resource = defineResource({
		feature: 'location',
		resource: 'location',
		urls,
		entitySchema: entity,
		filter,
		create,
		update,
	})

	it('exposes exactly the CRUD endpoints plus keys (no plugin surface)', () => {
		expect(Object.keys(resource).sort()).toEqual([
			'create',
			'detail',
			'keys',
			'list',
			'remove',
			'update',
		])
	})

	it('builds keys from the canonical factory (structured tuple)', () => {
		expect(resource.keys.lists()).toEqual(['location', 'location', 'list'])
		expect(resource.keys.list({ page: 1 })).toEqual(['location', 'location', 'list', { page: 1 }])
		expect(resource.keys.detail({ id: 5 })).toEqual(['location', 'location', 'detail', { id: 5 }])
	})

	it('uses the canonical keys for its own list/detail query keys', () => {
		expect(resource.list.queryKey({ page: 2 })).toEqual([
			'location',
			'location',
			'list',
			{ page: 2 },
		])
		expect(resource.detail.queryKey({ id: 7 })).toEqual([
			'location',
			'location',
			'detail',
			{ id: 7 },
		])
	})

	it('lets a feature compose extra endpoints alongside the CRUD bundle', () => {
		// The composition pattern: spread the resource, add hand-written endpoints
		// that reuse the resource's exported keys for invalidation targets.
		const composed = {
			...resource,
			archive: { keys: resource.keys },
		}
		expect(composed.list).toBe(resource.list)
		expect(composed.archive.keys.lists()).toEqual(['location', 'location', 'list'])
	})
})

describe('defineResource — locationScoped', () => {
	const resource = defineResource({
		feature: 'inventory',
		resource: 'stock',
		locationScoped: true,
		urls,
		entitySchema: entity,
		filter,
		create,
		update,
	})

	it('folds the active locationId into list/detail keys', () => {
		setActiveLocationAccessor(() => 4)
		expect(resource.list.queryKey({ page: 1 })).toEqual([
			'inventory',
			'stock',
			{ loc: 4 },
			'list',
			{ page: 1 },
		])
	})

	it('partitions per location so switch-back is a distinct cache entry', () => {
		setActiveLocationAccessor(() => 1)
		const a = resource.list.queryKey({ page: 1 })
		setActiveLocationAccessor(() => 2)
		const b = resource.list.queryKey({ page: 1 })
		expect(a).not.toEqual(b)
	})
})
