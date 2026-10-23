/// <reference lib="es2024.promise" />
// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router'

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import type { CompanySettingsUpdateDto } from '../dto/index.ts'
import { Route as CompanyRoute } from '@/routes/_authenticated/settings/company/edit.tsx'

const { update } = vi.hoisted(() => ({
	update: vi.fn<(input: CompanySettingsUpdateDto) => Promise<{ data: { id: number } }>>(),
}))
vi.mock('@/features/company/api.ts', () => ({
	companyDetail: {
		queryOptions: () => ({
			queryKey: ['company-retry-test'],
			queryFn: async () => ({
				data: {
					id: 1,
					name: 'Company',
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
	companyUpdate: { fetch: update },
}))
vi.mock('@/components/shared/permission-gate.tsx', () => ({ usePermissionCheck: () => true }))
vi.mock('@/components/ui/toast', () => ({ toast: { add: vi.fn<() => void>() } }))

const client = new QueryClient({
	defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})
afterEach(() => {
	cleanup()
	client.clear()
	update.mockReset()
})

it('allows same-value retry after failure but ignores further clicks until that save finishes', async () => {
	const saving = Promise.withResolvers<{ data: { id: number } }>()
	update
		.mockRejectedValueOnce(new Error('Connection unavailable'))
		.mockReturnValueOnce(saving.promise)
	const root = createRootRoute()
	const company = createRoute({
		getParentRoute: () => root,
		path: '/settings/company/edit',
		component: CompanyRoute.options.component,
	})
	const overview = createRoute({
		getParentRoute: () => root,
		path: '/settings/company',
		component: () => <p>Overview</p>,
	})
	const router = createRouter({
		routeTree: root.addChildren([company, overview]),
		history: createMemoryHistory({ initialEntries: ['/settings/company/edit'] }),
	})
	render(
		<QueryClientProvider client={client}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	)
	const name = await screen.findByRole('textbox', { name: 'Company Name' })
	fireEvent.change(name, { target: { value: 'Saved Company' } })
	fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
	const retry = await screen.findByRole<HTMLButtonElement>('button', { name: 'Retry save' })
	expect(update).toHaveBeenCalledTimes(1)
	expect(name).toHaveProperty('value', 'Saved Company')
	fireEvent.click(retry)
	await waitFor(() => expect(update).toHaveBeenCalledTimes(2))
	expect(retry.disabled).toBe(true)
	fireEvent.click(retry)
	fireEvent.click(retry)
	await act(async () => {
		saving.resolve({ data: { id: 1 } })
	})
	await waitFor(() => expect(screen.queryByRole('button', { name: 'Retry save' })).toBeNull())
	expect(update).toHaveBeenCalledTimes(2)
	expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Saved Company' }))
	expect(name).toHaveProperty('value', 'Saved Company')
	expect(await screen.findByText('Overview')).toBeTruthy()
})
