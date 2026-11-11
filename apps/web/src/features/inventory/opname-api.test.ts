// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'

import { queryClient } from '@/lib/tanstack-query'

import { opnameResource, stockKeys, movementKeys } from './api'

const keys = {
	list: opnameResource.keys.list({ locationId: 1 }),
	detail: opnameResource.keys.detail({ id: 7 }),
	stock: stockKeys.list({ locationId: 1 }),
	movement: movementKeys.list({ locationId: 1, materialId: 9 }),
	audit: ['audit/by-entity', { entity: 'stock_opname', entityId: 7 }],
}
afterEach(() => {
	queryClient.clear()
	vi.unstubAllGlobals()
})
function fixture() {
	vi.stubGlobal('localStorage', { getItem: () => null })
	const calls: { path: string; method: string; body: unknown }[] = []
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(async (input, init) => {
			calls.push({
				path: new URL(String(input), 'http://localhost').pathname,
				method: init?.method ?? 'GET',
				body: JSON.parse(String(init?.body)),
			})
			return Response.json({ success: true, code: 'OK', data: { id: 7 } })
		}),
	)
	for (const key of Object.values(keys)) queryClient.setQueryData(key, { data: [] })
	return calls
}
it('completes through the server endpoint and refreshes document, stock, movement and audit readers', async () => {
	const calls = fixture()
	await opnameResource.complete.fetch({ opnameId: 7 })
	expect(calls).toEqual([
		{ path: '/inventory/opname/complete', method: 'POST', body: { opnameId: 7 } },
	])
	for (const key of Object.values(keys))
		expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
})
it('saving counts keeps zero and reasons exact without claiming stock has changed', async () => {
	const calls = fixture()
	const body = {
		opnameId: 7,
		lines: [
			{ materialId: 9, countedQty: '0', reason: 'Empty shelf' },
			{ materialId: 10, countedQty: '9007199254740993.000125', reason: null },
		],
	}
	await opnameResource.updateCounts.fetch(body)
	expect(calls).toEqual([{ path: '/inventory/opname/counts', method: 'PUT', body }])
	for (const key of [keys.list, keys.detail, keys.audit])
		expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
	for (const key of [keys.stock, keys.movement])
		expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)
})
