// @vitest-environment jsdom
import { QueryObserver } from '@tanstack/react-query'

import { afterEach, expect, it, vi } from 'vitest'

import { queryClient } from '@/lib/tanstack-query'

import { assignmentResource } from './api'
import type { MaterialLocationDto } from './dto'

const audit = {
	createdAt: new Date('2026-01-01'),
	updatedAt: new Date('2026-01-01'),
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

it('refreshes both loaded relation directions after assigning and unassigning', async () => {
	let rows: MaterialLocationDto[] = []
	vi.stubGlobal('localStorage', { getItem: () => null })
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(async (input, init) => {
			const url = new URL(String(input), 'http://localhost')
			const { pathname, searchParams } = url
			if (pathname.endsWith('/assign')) rows = [{ id: 1, materialId: 7, locationId: 125, ...audit }]
			if (pathname.endsWith('/unassign')) rows = []
			const data =
				init?.method === 'POST'
					? { id: 1 }
					: pathname.endsWith('/by-material')
						? rows.filter((row) => row.materialId === Number(searchParams.get('materialId')))
						: rows.filter((row) => row.locationId === Number(searchParams.get('locationId')))
			return new Response(JSON.stringify({ success: true, code: 'OK', data }), {
				headers: { 'Content-Type': 'application/json' },
			})
		}),
	)
	const byMaterial = new QueryObserver(
		queryClient,
		assignmentResource.byMaterial.queryOptions({ materialId: 7 }, { retry: false }),
	)
	const byLocation = new QueryObserver(
		queryClient,
		assignmentResource.byLocation.queryOptions({ locationId: 125 }, { retry: false }),
	)
	subscriptions.push(
		byMaterial.subscribe(() => {}),
		byLocation.subscribe(() => {}),
	)
	await Promise.all([
		byMaterial.refetch({ throwOnError: true }),
		byLocation.refetch({ throwOnError: true }),
	])
	expect(byMaterial.getCurrentResult().data?.data).toEqual([])
	expect(byLocation.getCurrentResult().data?.data).toEqual([])

	await assignmentResource.assign.fetch({ materialId: 7, locationId: 125 })
	expect(byMaterial.getCurrentResult().data?.data.map((row) => row.locationId)).toEqual([125])
	expect(byLocation.getCurrentResult().data?.data.map((row) => row.materialId)).toEqual([7])

	await assignmentResource.unassign.fetch({ materialId: 7, locationId: 125 })
	expect(byMaterial.getCurrentResult().data?.data).toEqual([])
	expect(byLocation.getCurrentResult().data?.data).toEqual([])
})
