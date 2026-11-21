import { afterEach, describe, expect, it } from 'vitest'

import { getActiveLocationId, setActiveLocationAccessor } from './active-location.ts'

afterEach(() => {
	// Reset the module-level accessor between tests so cases don't leak.
	setActiveLocationAccessor(() => null)
})

describe('active-location accessor', () => {
	it('returns null when no accessor has been wired', () => {
		// A fresh app before the location provider boots: no accessor set yet.
		expect(getActiveLocationId()).toBeNull()
	})

	it('reads the current value through the wired accessor', () => {
		let current: number | null = 7
		setActiveLocationAccessor(() => current)

		expect(getActiveLocationId()).toBe(7)

		// The getter reflects live changes — it calls the accessor each time,
		// it does not snapshot the value at wiring time.
		current = 12
		expect(getActiveLocationId()).toBe(12)
	})

	it('supports the consolidated (all-locations) view as null', () => {
		setActiveLocationAccessor(() => null)
		expect(getActiveLocationId()).toBeNull()
	})
})
