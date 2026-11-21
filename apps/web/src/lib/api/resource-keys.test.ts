import { afterEach, describe, expect, it } from 'vitest'

import { setActiveLocationAccessor } from './active-location.ts'
import { createResourceKeys } from './resource-keys.ts'

afterEach(() => {
	setActiveLocationAccessor(() => null)
})

describe('createResourceKeys — plain (not location-scoped)', () => {
	const keys = createResourceKeys('location', 'location')

	it('produces a structured [feature, resource, kind] tuple', () => {
		expect(keys.all()).toEqual(['location', 'location'])
		expect(keys.lists()).toEqual(['location', 'location', 'list'])
		expect(keys.details()).toEqual(['location', 'location', 'detail'])
	})

	it('appends params as the trailing segment, normalizing absent params to null', () => {
		expect(keys.list({ page: 1 })).toEqual(['location', 'location', 'list', { page: 1 }])
		expect(keys.list()).toEqual(['location', 'location', 'list', null])
		expect(keys.detail({ id: 5 })).toEqual(['location', 'location', 'detail', { id: 5 }])
	})

	it('is deterministic — same inputs yield equal keys', () => {
		expect(keys.list({ page: 2, q: 'a' })).toEqual(keys.list({ page: 2, q: 'a' }))
	})

	it('does not fold in location for a plain resource even when one is active', () => {
		setActiveLocationAccessor(() => 3)
		expect(keys.list({ page: 1 })).toEqual(['location', 'location', 'list', { page: 1 }])
	})
})

describe('createResourceKeys — location-scoped', () => {
	const keys = createResourceKeys('inventory', 'stock', { locationScoped: true })

	it('folds the active locationId into the key after the resource segment', () => {
		setActiveLocationAccessor(() => 1)
		expect(keys.list({ materialId: 9 })).toEqual([
			'inventory',
			'stock',
			{ loc: 1 },
			'list',
			{ materialId: 9 },
		])
	})

	it('partitions cache per location — same params, different location, different key', () => {
		setActiveLocationAccessor(() => 1)
		const atLoc1 = keys.list({ materialId: 9 })
		setActiveLocationAccessor(() => 2)
		const atLoc2 = keys.list({ materialId: 9 })

		expect(atLoc1).not.toEqual(atLoc2)
	})

	it('represents the consolidated view with loc null', () => {
		setActiveLocationAccessor(() => null)
		expect(keys.list()).toEqual(['inventory', 'stock', { loc: null }, 'list', null])
	})

	it('scopes the lists() prefix by location too, so invalidation targets one location', () => {
		setActiveLocationAccessor(() => 4)
		expect(keys.lists()).toEqual(['inventory', 'stock', { loc: 4 }, 'list'])
	})
})
