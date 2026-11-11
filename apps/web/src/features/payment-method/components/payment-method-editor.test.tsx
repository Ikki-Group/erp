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

import type { PaymentMethodDto } from '../dto/index.ts'
import { PaymentMethodEditor } from './payment-method-editor.tsx'

type Saved = { data: { id: number } }
const { update, create } = vi.hoisted(() => ({
	update: vi.fn<(input: unknown) => Promise<Saved>>(),
	create: vi.fn<(input: unknown) => Promise<Saved>>(),
}))
vi.mock('../api.ts', () => ({
	paymentMethodMutations: { update: { fetch: update }, create: { fetch: create } },
}))
vi.mock('@/components/ui/toast', () => ({ toast: { add: vi.fn<() => void>() } }))

const method: PaymentMethodDto = {
	id: 3,
	code: 'QRIS',
	name: 'QRIS',
	type: 'digital',
	isActive: false,
	createdAt: new Date('2026-01-01'),
	updatedAt: new Date('2026-01-01'),
	createdBy: 1,
	updatedBy: 1,
}

const client = new QueryClient({
	defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})
afterEach(() => {
	cleanup()
	client.clear()
	update.mockReset()
	create.mockReset()
})

async function mount(props: { method?: PaymentMethodDto; canWrite: boolean }) {
	const onDone = vi.fn<() => void>()
	const root = createRootRoute()
	const page = createRoute({
		getParentRoute: () => root,
		path: '/',
		component: () => <PaymentMethodEditor {...props} onDone={onDone} />,
	})
	const router = createRouter({
		routeTree: root.addChildren([page]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
	})
	render(
		<QueryClientProvider client={client}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	)
	await screen.findByRole('textbox', { name: 'Name' })
	return { onDone }
}

it('saves the normalized edit payload for the loaded record and finishes', async () => {
	update.mockResolvedValue({ data: { id: 3 } })
	const { onDone } = await mount({ method, canWrite: true })
	fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
		target: { value: '  QRIS Static  ' },
	})
	fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
	await waitFor(() => expect(onDone).toHaveBeenCalled())
	expect(update).toHaveBeenCalledWith({
		id: 3,
		code: 'QRIS',
		name: 'QRIS Static',
		type: 'digital',
		isActive: false,
	})
})

it('keeps the draft after a failed save and retries once without duplicate in-flight saves', async () => {
	const saving = Promise.withResolvers<Saved>()
	create
		.mockRejectedValueOnce(new Error('Connection unavailable'))
		.mockReturnValueOnce(saving.promise)
	const { onDone } = await mount({ canWrite: true })
	const name = screen.getByRole('textbox', { name: 'Name' })
	fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), { target: { value: 'GOPAY' } })
	fireEvent.change(name, { target: { value: 'GoPay' } })
	fireEvent.click(screen.getByRole('button', { name: 'Create' }))
	const retry = await screen.findByRole<HTMLButtonElement>('button', { name: 'Retry save' })
	expect(await screen.findByText('Connection unavailable')).toBeTruthy()
	expect(name).toHaveProperty('value', 'GoPay')
	fireEvent.click(retry)
	await waitFor(() => expect(create).toHaveBeenCalledTimes(2))
	expect(screen.queryByRole('button', { name: 'Retry save' })).toBeNull()
	const submitting = screen.getByRole<HTMLButtonElement>('button', { name: /Create/u })
	expect(submitting.disabled).toBe(true)
	fireEvent.click(submitting)
	await act(async () => {
		saving.resolve({ data: { id: 9 } })
	})
	await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
	expect(create).toHaveBeenCalledTimes(2)
	expect(create).toHaveBeenLastCalledWith({
		code: 'GOPAY',
		name: 'GoPay',
		type: 'cash',
		isActive: true,
	})
})

it('offers no save to a read-only user and never calls the server', async () => {
	await mount({ method, canWrite: false })
	expect(screen.queryByRole('button', { name: 'Save Changes' })).toBeNull()
	expect(screen.getByText(/don.t have permission/iu)).toBeTruthy()
	expect(screen.getByRole('textbox', { name: 'Name' }).matches(':disabled')).toBe(true)
	expect(update).not.toHaveBeenCalled()
})
