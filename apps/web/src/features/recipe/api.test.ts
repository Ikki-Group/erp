// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'

import { ApiError } from '@/lib/api/index.ts'
import { queryClient } from '@/lib/tanstack-query'

import { recipeResource } from './api'

afterEach(() => {
	queryClient.clear()
	vi.unstubAllGlobals()
})

function seedRecipeFamily() {
	const family = {
		list: recipeResource.keys.list({ page: 1, limit: 10 }),
		detail: recipeResource.keys.detail({ id: 4 }),
		byMenuItem: recipeResource.keys.byMenuItem({ menuItemId: 9 }),
		hpp: recipeResource.keys.hpp({ menuItemId: 9, locationId: 1 }),
	}
	for (const key of Object.values(family)) queryClient.setQueryData(key, { stale: false })
	return family
}

function stubSuccess(data: unknown) {
	vi.stubGlobal('localStorage', { getItem: () => null })
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(
			async () =>
				new Response(JSON.stringify({ success: true, code: 'OK', data }), {
					headers: { 'Content-Type': 'application/json' },
				}),
		),
	)
}

const line = { materialId: 1, quantity: '0.5', uomId: 2 }

it.each([
	[
		'update',
		() => recipeResource.update.fetch({ id: 4, name: 'Kopi', yieldQty: '1', lines: [line] }),
	],
	[
		'create',
		() =>
			recipeResource.create.fetch({ menuItemId: 9, name: 'Kopi', yieldQty: '1', lines: [line] }),
	],
	['remove', () => recipeResource.remove.fetch({ id: 4 })],
])('a successful %s invalidates list, detail, by-menu-item and HPP reads', async (_name, run) => {
	stubSuccess({ id: 4 })
	const family = seedRecipeFamily()

	await run()

	for (const key of Object.values(family)) {
		expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
	}
})

it('keeps recipe reads when the request fails', async () => {
	vi.stubGlobal('localStorage', { getItem: () => null })
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(
			async () =>
				new Response(JSON.stringify({ success: false, code: 'X', message: 'boom' }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}),
		),
	)
	const family = seedRecipeFamily()

	await expect(recipeResource.remove.fetch({ id: 4 })).rejects.toThrow(ApiError)

	for (const key of Object.values(family)) {
		expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)
	}
})
