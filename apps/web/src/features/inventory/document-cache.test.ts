// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'

import { ApiError } from '@/lib/api'
import { queryClient } from '@/lib/tanstack-query'

import { receivingResource, transferResource, stockKeys, movementKeys } from './api'

const filters = { page: 1, limit: 10, locationId: 1 }
const stock = stockKeys.list(filters)
const movements = movementKeys.list({ ...filters, materialId: 225 })
const history = ['audit/by-entity', { entity: 'transfer_request', entityId: 1 }]
const actions = [
	{
		name: 'confirm receiving',
		run: () => receivingResource.confirm.fetch({ receivingId: 1 }),
		list: receivingResource.keys.list(filters),
		detail: receivingResource.keys.detail({ id: 1 }),
	},
	{
		name: 'ship transfer',
		run: () => transferResource.ship.fetch({ transferId: 1 }),
		list: transferResource.keys.list(filters),
		detail: transferResource.keys.detail({ id: 1 }),
	},
	{
		name: 'receive transfer',
		run: () =>
			transferResource.receive.fetch({
				transferId: 1,
				lines: [{ materialId: 225, receivedQty: '0.000125' }],
			}),
		list: transferResource.keys.list(filters),
		detail: transferResource.keys.detail({ id: 1 }),
	},
]
afterEach(() => {
	queryClient.clear()
	vi.unstubAllGlobals()
})

it.each(actions)(
	'$name invalidates document, stock, movement and audit readers',
	async ({ run, list, detail }) => {
		vi.stubGlobal('localStorage', { getItem: () => null })
		vi.stubGlobal(
			'fetch',
			vi.fn<typeof fetch>(async () =>
				Response.json({ success: true, code: 'OK', data: { id: 1 } }),
			),
		)
		for (const key of [stock, movements, history, list, detail])
			queryClient.setQueryData(key, { data: [] })
		await run()
		for (const key of [stock, movements, history, list, detail])
			expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
	},
)

it('does not mark stock changed when a document transition fails', async () => {
	vi.stubGlobal('localStorage', { getItem: () => null })
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(async () =>
			Response.json({ code: 'CONFLICT', message: 'Insufficient stock' }, { status: 409 }),
		),
	)
	queryClient.setQueryData(stock, { data: [{ quantity: '0' }] })
	await expect(transferResource.ship.fetch({ transferId: 1 })).rejects.toThrow(ApiError)
	expect(queryClient.getQueryState(stock)?.isInvalidated).toBe(false)
})
