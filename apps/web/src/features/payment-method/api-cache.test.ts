// @vitest-environment jsdom
import { QueryObserver } from '@tanstack/react-query'

import { afterEach, expect, it, vi } from 'vitest'

import { queryClient } from '@/lib/tanstack-query'

import { paymentMethodByLocation, paymentMethodMutations, paymentMethodResource } from './api'
import type { PaymentMethodDto } from './dto'

const audit = {
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
	createdBy: 1,
	updatedBy: 1,
}
const subscriptions: (() => void)[] = []
afterEach(() => {
	for (const unsubscribe of subscriptions) unsubscribe()
	subscriptions.length = 0
	queryClient.clear()
	vi.unstubAllGlobals()
})

function serve(initial: PaymentMethodDto[]) {
	let rows = initial
	vi.stubGlobal('localStorage', { getItem: () => null })
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(async (input, init) => {
			const url = new URL(String(input), 'http://localhost')
			const method = init?.method ?? 'GET'
			let data: unknown = { id: 1 }
			if (method === 'PUT') {
				const body = JSON.parse(String(init?.body)) as PaymentMethodDto
				rows = rows.map((row) => (row.id === body.id ? { ...row, ...body } : row))
			} else if (method === 'DELETE') {
				const id = Number(url.searchParams.get('id'))
				rows = rows.filter((row) => row.id !== id)
			} else if (url.pathname.endsWith('/by-location')) {
				data = rows.filter((row) => row.isActive)
			} else if (url.searchParams.has('id')) {
				data = rows.find((row) => row.id === Number(url.searchParams.get('id')))
			} else if (method === 'GET') {
				const meta = { page: 1, limit: 10, total: rows.length, totalPages: 1 }
				return Response.json({ success: true, code: 'OK', data: rows, meta })
			}
			return Response.json({ success: true, code: 'OK', data })
		}),
	)
}

it('refreshes loaded list, detail and by-location readers after update and delete', async () => {
	const cash: PaymentMethodDto = {
		id: 1,
		code: 'CASH',
		name: 'Cash',
		type: 'cash',
		isActive: true,
		...audit,
	}
	serve([cash])
	const list = new QueryObserver(
		queryClient,
		paymentMethodResource.list.queryOptions({ page: 1, limit: 10 }, { retry: false }),
	)
	const detail = new QueryObserver(
		queryClient,
		paymentMethodResource.detail.queryOptions({ id: 1 }, { retry: false }),
	)
	const byLocation = new QueryObserver(
		queryClient,
		paymentMethodByLocation.query.queryOptions({ locationId: 5 }, { retry: false }),
	)
	subscriptions.push(
		list.subscribe(() => {}),
		detail.subscribe(() => {}),
		byLocation.subscribe(() => {}),
	)
	await Promise.all([
		list.refetch({ throwOnError: true }),
		detail.refetch({ throwOnError: true }),
		byLocation.refetch({ throwOnError: true }),
	])
	expect(detail.getCurrentResult().data?.data.name).toBe('Cash')
	expect(byLocation.getCurrentResult().data?.data).toHaveLength(1)

	await paymentMethodMutations.update.fetch({
		id: 1,
		code: 'CASH',
		name: 'Cash Drawer',
		type: 'cash',
		isActive: false,
	})
	expect(list.getCurrentResult().data?.data[0]?.name).toBe('Cash Drawer')
	expect(detail.getCurrentResult().data?.data.name).toBe('Cash Drawer')
	expect(byLocation.getCurrentResult().data?.data).toEqual([])

	await paymentMethodMutations.remove.fetch({ id: 1 })
	expect(list.getCurrentResult().data?.data).toEqual([])
})
