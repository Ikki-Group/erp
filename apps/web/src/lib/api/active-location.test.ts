import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { getActiveLocationId, setActiveLocationId, useActiveLocationId } from './active-location.ts'

afterEach(() => setActiveLocationId(null))

describe('active location store', () => {
	it('stores the selection', () => {
		setActiveLocationId(7)
		expect(getActiveLocationId()).toBe(7)
	})

	it('null is the consolidated view', () => {
		setActiveLocationId(3)
		setActiveLocationId(null)
		expect(getActiveLocationId()).toBeNull()
	})

	it('re-renders subscribers on change', () => {
		const { result } = renderHook(() => useActiveLocationId())
		expect(result.current).toBeNull()
		act(() => setActiveLocationId(12))
		expect(result.current).toBe(12)
	})
})
