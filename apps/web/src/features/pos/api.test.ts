import { afterEach, describe, expect, it } from 'vitest'

import { setActiveLocationAccessor } from '@/lib/api/index.ts'

import { orderResource, shiftResource } from './api.ts'

afterEach(() => {
	setActiveLocationAccessor(() => null)
})

describe('POS location-scoped keys partition per active location', () => {
	it('folds the active locationId into the order list key', () => {
		setActiveLocationAccessor(() => 1)
		const atLoc1 = orderResource.list.queryKey({ page: 1, limit: 20, locationId: 1 })
		setActiveLocationAccessor(() => 2)
		const atLoc2 = orderResource.list.queryKey({ page: 1, limit: 20, locationId: 2 })

		// Same list kind, different active location → distinct cache entries.
		expect(atLoc1).not.toEqual(atLoc2)
		expect(atLoc1).toEqual([
			'pos',
			'order',
			{ loc: 1 },
			'list',
			{ page: 1, limit: 20, locationId: 1 },
		])
	})

	it('folds the active locationId into the shift active key', () => {
		setActiveLocationAccessor(() => 1)
		const atLoc1 = shiftResource.active.queryKey()
		setActiveLocationAccessor(() => 2)
		const atLoc2 = shiftResource.active.queryKey()

		expect(atLoc1).not.toEqual(atLoc2)
		expect(atLoc1).toEqual(['pos', 'shift', { loc: 1 }, 'active'])
	})

	it('scopes the shift list-invalidation prefix by the active location', () => {
		setActiveLocationAccessor(() => 4)
		// `keys.lists()` is the prefix a location-switch / mutation invalidates —
		// it must carry the {loc} segment so it only hits this location's lists.
		expect(shiftResource.keys.lists()).toEqual(['pos', 'shift', { loc: 4 }, 'list'])
	})

	it('keeps the consolidated view (loc null) as its own partition', () => {
		setActiveLocationAccessor(() => null)
		expect(orderResource.list.queryKey({ page: 1, limit: 20, locationId: 1 })).toEqual([
			'pos',
			'order',
			{ loc: null },
			'list',
			{ page: 1, limit: 20, locationId: 1 },
		])
	})
})
