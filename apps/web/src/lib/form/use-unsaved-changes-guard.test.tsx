import {
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@tanstack/react-router'

// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppForm } from './app-form.ts'
import { useUnsavedChangesGuard } from './use-unsaved-changes-guard.ts'

const { confirm } = vi.hoisted(() => ({ confirm: vi.fn<() => Promise<boolean>>() }))
vi.mock('@/components/shared/confirm', () => ({ confirm }))

let submit: () => Promise<void>

function Page() {
	const form = useAppForm({ defaultValues: { name: 'Original' }, onSubmit: async () => {} })
	submit = () => form.handleSubmit()
	useUnsavedChangesGuard(form)
	return (
		<form.Field name="name">
			{(field) => (
				<input
					aria-label="Name"
					value={field.state.value}
					onChange={(event) => field.handleChange(event.target.value)}
				/>
			)}
		</form.Field>
	)
}

async function mount() {
	const root = createRootRoute()
	const page = createRoute({ getParentRoute: () => root, path: '/', component: Page })
	const other = createRoute({
		getParentRoute: () => root,
		path: '/demo',
		component: () => <p>Destination</p>,
	})
	const router = createRouter({
		routeTree: root.addChildren([page, other]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
	})
	render(<RouterProvider router={router} />)
	await screen.findByRole('textbox', { name: 'Name' })
	return router
}

beforeEach(() => {
	confirm.mockReset().mockResolvedValue(false)
})
afterEach(cleanup)

describe('unsaved changes guard', () => {
	it('lets the user leave right after a successful submit without prompting', async () => {
		const router = await mount()
		fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Saved' } })
		await act(() => submit())
		await act(() => router.navigate({ to: '/demo' }))
		expect(confirm).not.toHaveBeenCalled()
		expect(router.state.location.pathname).toBe('/demo')
	})

	it('blocks leaving when edited after a successful submit', async () => {
		const router = await mount()
		fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Saved' } })
		await act(() => submit())
		fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
			target: { value: 'Unsaved' },
		})
		act(() => {
			void router.navigate({ to: '/demo' })
		})
		await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1))
		expect(router.state.location.pathname).toBe('/')
	})
})
