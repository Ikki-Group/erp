import { describe, expect, it } from 'vitest'

import { FRESHNESS_TIERS, resolveFreshness } from './freshness.ts'
import type { FreshnessTier } from './freshness.ts'

describe('freshness tiers', () => {
	it('maps every named tier to concrete query options', () => {
		const tiers: FreshnessTier[] = ['static', 'standard', 'volatile', 'realtime']
		for (const tier of tiers) {
			const opts = resolveFreshness(tier)
			expect(opts).toHaveProperty('staleTime')
			expect(opts).toHaveProperty('gcTime')
		}
	})

	it('orders staleness by tier: static > standard > volatile >= realtime', () => {
		const s = resolveFreshness('static').staleTime
		const std = resolveFreshness('standard').staleTime
		const vol = resolveFreshness('volatile').staleTime
		const rt = resolveFreshness('realtime').staleTime

		expect(s).toBeGreaterThan(std)
		expect(std).toBeGreaterThan(vol)
		expect(vol).toBeGreaterThanOrEqual(rt)
	})

	it('makes realtime always stale (staleTime 0)', () => {
		expect(resolveFreshness('realtime').staleTime).toBe(0)
	})

	it('gives standard the current app-wide default of 3 minutes', () => {
		// The redesign preserves the existing global default as the `standard`
		// tier so unlabeled queries keep their current behavior.
		expect(resolveFreshness('standard').staleTime).toBe(3 * 60 * 1000)
	})

	it('attaches a refetchInterval only to volatile', () => {
		expect(resolveFreshness('volatile').refetchInterval).toBeGreaterThan(0)
		expect(resolveFreshness('static').refetchInterval).toBeUndefined()
		expect(resolveFreshness('standard').refetchInterval).toBeUndefined()
	})

	it('returns a fresh options object each call (no shared mutable reference)', () => {
		const a = resolveFreshness('standard')
		const b = resolveFreshness('standard')
		expect(a).not.toBe(b)
		expect(a).toEqual(b)
	})

	it('exposes the tier table for documentation/inspection', () => {
		expect(Object.keys(FRESHNESS_TIERS).sort()).toEqual([
			'realtime',
			'standard',
			'static',
			'volatile',
		])
	})
})
