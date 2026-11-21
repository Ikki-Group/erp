import { describe, expect, it } from 'vitest'

import { ApiError } from '@/lib/api/index.ts'

import { resolveHppView } from './hpp-view.ts'

const active = { isActive: true }
const loaded = { data: { data: { hpp: '0.0000' } }, isError: false, error: null }

describe('HPP display state', () => {
	it('never shows the active recipe cost for an inactive recipe', () => {
		expect(resolveHppView({ isActive: false }, loaded)).toEqual({ kind: 'inactive' })
	})

	it('treats a zero cost as a real value, not as missing', () => {
		expect(resolveHppView(active, loaded)).toEqual({ kind: 'value', hpp: '0.0000' })
	})

	it('distinguishes loading, no active recipe, and request failure', () => {
		expect(resolveHppView(active, { isError: false, error: null })).toEqual({ kind: 'loading' })
		const missing = new ApiError('none', { status: 404, code: 'RECIPE_ACTIVE_NOT_FOUND' })
		expect(resolveHppView(active, { isError: true, error: missing })).toEqual({
			kind: 'no-active-recipe',
		})
		const down = new ApiError('down', { status: 500 })
		expect(resolveHppView(active, { isError: true, error: down })).toEqual({ kind: 'error' })
		expect(resolveHppView(active, { isError: true, error: new Error('offline') })).toEqual({
			kind: 'error',
		})
	})

	it('keeps a loaded cost visible when a refresh fails', () => {
		const down = new ApiError('down', { status: 500 })
		expect(resolveHppView(active, { ...loaded, isError: true, error: down })).toEqual({
			kind: 'value',
			hpp: '0.0000',
		})
	})
})
