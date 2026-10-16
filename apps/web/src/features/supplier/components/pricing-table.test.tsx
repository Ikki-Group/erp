// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { PricingTable } from './pricing-table'

const fixture = vi.hoisted(() => ({
	permissions: { read: true, create: true, update: true, delete: true },
	failList: false,
	failMaterial: false,
	listCalls: [] as { supplierId: number; page: number; limit: number }[],
	pages: 2,
}))

vi.mock('../api.ts', () => ({
	pricingResource: {
		list: {
			queryOptions: (query: { supplierId: number; page: number; limit: number }) => ({
				queryKey: ['pricing', query],
				queryFn: async () => {
					fixture.listCalls.push(query)
					if (fixture.failList) throw new Error('Pricing unavailable')
					return {
						data:
							query.page <= fixture.pages
								? [
										{
											id: query.page,
											supplierId: query.supplierId,
											materialId: 225,
											uomId: 125,
											unitPrice: '82340.500125',
											minOrderQty: '0',
										},
									]
								: [],
						meta: { total: fixture.pages === 2 ? 21 : 20, totalPages: fixture.pages },
					}
				},
			}),
		},
	},
}))

vi.mock('@/features/material/api', () => ({
	materialResource: {
		detail: {
			queryOptions: ({ id }: { id: number }) => ({
				queryKey: ['material', 'detail', id],
				queryFn: async () => {
					if (fixture.failMaterial) throw new Error('Material unavailable')
					return { data: { id, name: 'Precise ingredient', code: 'MAT-225' } }
				},
			}),
		},
	},
}))

vi.mock('@/features/uom/api', () => ({
	uomResource: {
		detail: {
			queryOptions: ({ id }: { id: number }) => ({
				queryKey: ['uom', 'detail', id],
				queryFn: async () => ({ data: { id, name: 'Test unit', code: 'UOM-125' } }),
			}),
		},
	},
}))

const clients: QueryClient[] = []
function renderPricing(supplierId = 7) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: Infinity } },
	})
	clients.push(client)
	const view = render(
		<QueryClientProvider client={client}>
			<PricingTable supplierId={supplierId} permissions={fixture.permissions} />
		</QueryClientProvider>,
	)
	return { client, ...view }
}

beforeEach(() => {
	fixture.permissions = { read: true, create: true, update: true, delete: true }
	fixture.failList = false
	fixture.failMaterial = false
	fixture.listCalls = []
	fixture.pages = 2
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	)
})

afterEach(() => {
	cleanup()
	for (const client of clients) client.clear()
	clients.length = 0
	vi.unstubAllGlobals()
})

it('shows initial failure rather than an empty list and keeps Add and retry available', async () => {
	fixture.failList = true
	renderPricing()
	await screen.findByText('Could not load pricing')
	expect(screen.queryByText('No pricing entries for this supplier.')).toBeNull()
	expect(screen.getByRole('button', { name: 'Add Pricing' })).toBeTruthy()
	fixture.failList = false
	fireEvent.click(screen.getByRole('button', { name: /try again|retry/iu }))
	await screen.findByText('Rp 82.340,500125')
	await screen.findByText('MAT-225')
	await screen.findByText('UOM-125')
})

it('retains exact prices and navigation on a refresh failure, then retries', async () => {
	const { client } = renderPricing()
	await screen.findByText('Rp 82.340,500125')
	fixture.failList = true
	await act(async () => {
		await client.invalidateQueries({ queryKey: ['pricing'] })
	})
	await screen.findByText('Could not refresh pricing. Showing the last loaded results.')
	expect(screen.getByText('Rp 82.340,500125')).toBeTruthy()
	expect(screen.getByText('0')).toBeTruthy()
	expect(screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')).toBe(false)
	fixture.failList = false
	fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
	await waitFor(() =>
		expect(
			screen.queryByText('Could not refresh pricing. Showing the last loaded results.'),
		).toBeNull(),
	)
})

it('recovers to a valid page when the final last-page entry disappears, and resets for another supplier', async () => {
	const { client, rerender } = renderPricing()
	await screen.findByText('Rp 82.340,500125')
	fireEvent.click(screen.getByRole('button', { name: 'Next' }))
	await waitFor(() => expect(fixture.listCalls.some((query) => query.page === 2)).toBe(true))
	await screen.findByText('Page 2 of 2')
	fixture.pages = 1
	await act(async () => {
		await client.invalidateQueries({ queryKey: ['pricing'] })
	})
	await screen.findByText('Page 1 of 1')
	expect(screen.getByText('Rp 82.340,500125')).toBeTruthy()
	fixture.pages = 2
	await act(async () => {
		await client.invalidateQueries({ queryKey: ['pricing'] })
	})
	await waitFor(() =>
		expect(screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')).toBe(false),
	)
	fireEvent.click(screen.getByRole('button', { name: 'Next' }))
	await screen.findByText('Page 2 of 2')
	rerender(
		<QueryClientProvider client={client}>
			<PricingTable supplierId={8} permissions={fixture.permissions} />
		</QueryClientProvider>,
	)
	await waitFor(() =>
		expect(fixture.listCalls.some((query) => query.supplierId === 8 && query.page === 1)).toBe(
			true,
		),
	)
	await screen.findByText('Page 1 of 2')
	expect(fixture.listCalls.every((query) => query.limit === 20)).toBe(true)
})

it('recovers unavailable canonical labels without replacing the price row', async () => {
	fixture.failMaterial = true
	renderPricing()
	await screen.findByText('Material #225 — unavailable')
	expect(screen.getByText('Rp 82.340,500125')).toBeTruthy()
	fixture.failMaterial = false
	fireEvent.click(screen.getByRole('button', { name: 'Retry material #225' }))
	await screen.findByText('MAT-225')
})

it('does not offer write actions to read-only users or query pricing without read access', async () => {
	fixture.permissions = { read: true, create: false, update: false, delete: false }
	const { rerender, client } = renderPricing()
	await screen.findByText('Rp 82.340,500125')
	expect(screen.queryByRole('button', { name: 'Add Pricing' })).toBeNull()
	expect(screen.queryByRole('button', { name: 'Pricing actions' })).toBeNull()
	fixture.permissions = { read: false, create: false, update: false, delete: false }
	const calls = fixture.listCalls.length
	rerender(
		<QueryClientProvider client={client}>
			<PricingTable supplierId={8} permissions={fixture.permissions} />
		</QueryClientProvider>,
	)
	expect(screen.getByRole('alert').textContent).toContain('permission to view')
	expect(fixture.listCalls).toHaveLength(calls)
})
