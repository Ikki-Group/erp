// @vitest-environment jsdom
import { useState } from 'react'
import type { ReactNode } from 'react'

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthLocation } from '@/features/auth/dto'

import { useEditorLocationScope } from './use-editor-location-scope'
import { LocationProvider, useLocationContext } from '@/providers/location-provider'

const locations: AuthLocation[] = [
	{ id: 1, name: 'Kemang', code: 'KMG', type: 'store' },
	{ id: 2, name: 'BSD', code: 'BSD', type: 'store' },
]
beforeEach(() => {
	const storage = new Map<string, string>()
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => {
			storage.set(key, value)
		},
		removeItem: (key: string) => {
			storage.delete(key)
		},
	})
})
afterEach(() => {
	cleanup()
	vi.unstubAllGlobals()
})

function wrapper({ children }: { children: ReactNode }) {
	return <LocationProvider locations={locations}>{children}</LocationProvider>
}
function useSession(fixedLocationId?: number) {
	const scope = useEditorLocationScope(fixedLocationId)
	const context = useLocationContext()
	const [draft, setDraft] = useState('Unsaved name')
	return { scope, context, draft, setDraft }
}

describe('editor location sessions', () => {
	it('adopts the first selected location then preserves the pin and draft across switches and All Locations', () => {
		const { result } = renderHook(() => useSession(), { wrapper })
		expect(result.current.scope.location).toBeNull()
		act(() => result.current.context.switchLocation(1))
		expect(result.current.scope.location?.id).toBe(1)
		act(() => {
			result.current.setDraft('Edited draft')
			result.current.context.switchLocation(2)
		})
		expect(result.current.scope.location?.id).toBe(1)
		expect(result.current.scope.isCurrent).toBe(false)
		expect(result.current.draft).toBe('Edited draft')
		act(() => result.current.context.switchLocation(null))
		expect(result.current.scope.location?.id).toBe(1)
		act(() => result.current.scope.restore())
		expect(result.current.scope.isCurrent).toBe(true)
		expect(result.current.context.activeLocation?.id).toBe(1)
		expect(result.current.draft).toBe('Edited draft')
	})

	it.each([null, 2])('uses an existing record location when the header starts at %s', (header) => {
		localStorage.setItem('ikki-active-location-id', String(header))
		const { result } = renderHook(() => useSession(1), { wrapper })
		expect(result.current.scope.location).toMatchObject({ id: 1, name: 'Kemang' })
		expect(result.current.scope.isCurrent).toBe(false)
		act(() => result.current.scope.restore())
		expect(result.current.context.activeLocation?.id).toBe(1)
		expect(result.current.scope.isCurrent).toBe(true)
	})

	it('retains inaccessible record ownership rather than substituting the active location', () => {
		localStorage.setItem('ikki-active-location-id', '2')
		const { result } = renderHook(() => useSession(99), { wrapper })
		expect(result.current.scope.location?.id).toBe(99)
		expect(result.current.scope.canRestore).toBe(false)
		act(() => result.current.scope.restore())
		expect(result.current.context.activeLocation?.id).toBe(2)
		expect(result.current.scope.isCurrent).toBe(false)
	})
})
