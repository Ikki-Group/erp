// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import type { CompanyOverviewDto } from '../dto/index.ts'
import { Route as OverviewRoute } from '@/routes/_authenticated/settings/company/index.tsx'

const { overview } = vi.hoisted(() => ({ overview: { current: null as unknown } }))
vi.mock('@/features/company/api.ts', () => ({
	companyDetail: {
		queryOptions: () => ({
			queryKey: ['company-overview-test', 'settings'],
			queryFn: async () => ({
				data: {
					id: 1,
					name: 'Ikki Coffee',
					address: null,
					phone: null,
					email: null,
					taxId: null,
					taxRate: '11.00',
					currencyCode: 'IDR',
					currencySymbol: 'Rp',
					logoUrl: null,
					receiptFooter: null,
				},
			}),
		}),
	},
	companyOverview: {
		queryOptions: () => ({
			queryKey: ['company-overview-test', 'overview'],
			queryFn: async () => ({ data: overview.current }),
		}),
	},
}))
vi.mock('@/components/shared/permission-gate.tsx', () => ({ usePermissionCheck: () => true }))
vi.mock('@/components/shared/permission-gate', () => ({ usePermissionCheck: () => true }))

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
afterEach(() => {
	cleanup()
	client.clear()
})

const site = {
	id: 7,
	code: 'KMG',
	name: 'Kemang',
	type: 'store',
	isActive: true,
	staff: 4,
	transfersInTransit: 1,
	draftReceivings: 2,
	openOpnames: 0,
	lowStock: 3,
	openShifts: 1,
	salesToday: { orders: 12, revenue: '1250000.00' },
} satisfies CompanyOverviewDto['sites'][number]

function renderOverview(data: CompanyOverviewDto) {
	overview.current = data
	const root = createRootRoute()
	const company = createRoute({
		getParentRoute: () => root,
		path: '/settings/company',
		component: OverviewRoute.options.component,
	})
	const router = createRouter({
		routeTree: root.addChildren([company]),
		history: createMemoryHistory({ initialEntries: ['/settings/company'] }),
	})
	render(
		<QueryClientProvider client={client}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	)
}

const base = {
	locations: { total: 1, stores: 1, warehouses: 0, inactive: 0 },
	businessDate: '2026-10-24',
	sites: [site],
}

it('renders sites with today sales and the people block', async () => {
	renderOverview({
		...base,
		people: { activeUsers: 5, inactiveUsers: 1, usersWithoutAccess: 2, roles: 3 },
	})
	expect(await screen.findByRole('link', { name: 'Kemang' })).toBeTruthy()
	expect(screen.getByText('Without access')).toBeTruthy()
	expect(screen.getByText(/1\.250\.000/u)).toBeTruthy()
})

it('hides the people block when the server returns null', async () => {
	renderOverview({ ...base, people: null })
	expect(await screen.findByRole('link', { name: 'Kemang' })).toBeTruthy()
	expect(screen.queryByText('Without access')).toBeNull()
	expect(screen.queryByText('Roles')).toBeNull()
})
