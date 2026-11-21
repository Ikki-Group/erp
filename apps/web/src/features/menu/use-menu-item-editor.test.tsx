// @vitest-environment jsdom
/// <reference lib="es2024.promise" />
import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setActiveLocationAccessor } from '@/lib/api/active-location'
import { useEditorLocationScope } from '@/lib/form/use-editor-location-scope'
import type { EntityForm } from '@/lib/form/use-entity-form'

import type { AuthLocation } from '@/features/auth/dto'

import type { MenuItemDetailDto } from './dto/index.ts'
import type { MenuItemFormValues } from './menu-item-form-values'
import { useMenuItemEditor } from './use-menu-item-editor.ts'
import { LocationProvider, useLocationContext } from '@/providers/location-provider'

const permission = vi.hoisted(() => ({ allowed: true }))
vi.mock('@/components/shared/permission-gate', () => ({
	usePermissionCheck: () => permission.allowed,
}))

const locations: AuthLocation[] = [
	{ id: 1, name: 'Kemang', code: 'KMG', type: 'store' },
	{ id: 2, name: 'BSD', code: 'BSD', type: 'store' },
]

const item: MenuItemDetailDto = {
	id: 1,
	locationId: 1,
	sku: 'MNU-1',
	name: 'Es Kopi',
	categoryId: 125,
	basePrice: '82340.500125',
	status: 'active',
	imageUrl: 'retained.png',
	category: { id: 125, name: 'Kemang category 125' },
	modifierGroups: [],
	createdAt: new Date('2026-01-01'),
	updatedAt: new Date('2026-01-01'),
	createdBy: 1,
	updatedBy: 1,
}

let client: QueryClient
let calls: { url: string; method: string; body: unknown; header: string | null }[] = []
let respond: () => Promise<Response>

const ok = () =>
	new Response(JSON.stringify({ success: true, code: 'OK', data: { id: 1 } }), {
		headers: { 'Content-Type': 'application/json' },
	})

beforeEach(() => {
	const storage = new Map<string, string>()
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => {
			storage.set(key, value)
		},
		removeItem: (key: string) => {
			storage.delete(key)
		},
		clear: () => storage.clear(),
	})
	client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
	permission.allowed = true
	calls = []
	respond = async () => ok()
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(async (url, init) => {
			calls.push({
				url: String(url),
				method: init?.method ?? 'GET',
				body: init?.body ? JSON.parse(String(init.body)) : undefined,
				header: new Headers(init?.headers).get('X-Location-ID'),
			})
			return respond()
		}),
	)
})

afterEach(() => {
	cleanup()
	localStorage.clear()
	vi.unstubAllGlobals()
	client.clear()
	setActiveLocationAccessor(() => null)
})

function wrapper({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={client}>
			<LocationProvider locations={locations}>{children}</LocationProvider>
		</QueryClientProvider>
	)
}

function useSession(record: MenuItemDetailDto | undefined, onSaved = () => {}) {
	const scope = useEditorLocationScope(record?.locationId)
	const context = useLocationContext()
	setActiveLocationAccessor(() => context.activeLocation?.id ?? null)
	const form = useMenuItemEditor({ item: record, location: scope.location!, onSaved })
	return { scope, context, form }
}

function openAt(header: number | null, record: MenuItemDetailDto | null = item) {
	if (header !== null) localStorage.setItem('ikki-active-location-id', String(header))
	return renderHook(() => useSession(record ?? undefined), { wrapper })
}

const submit = (result: { current: { form: EntityForm<MenuItemFormValues> } }) =>
	act(async () => {
		await result.current.form.handleSubmit()
	})

describe('menu item editor location scope', () => {
	it.each([2, null])(
		'edit opened under header %s pins the record location and refuses to save, keeping the draft',
		async (header) => {
			const { result } = openAt(header)
			expect(result.current.scope.location?.id).toBe(1)
			expect(result.current.scope.isCurrent).toBe(false)
			act(() => result.current.form.setFieldValue('name', 'Edited draft'))
			await submit(result)
			expect(calls).toHaveLength(0)
			expect(result.current.form.state.values.name).toBe('Edited draft')
			expect(String(result.current.form.state.errorMap.onSubmit)).toContain('Kemang')
		},
	)

	it('saves an edit only after the record location is restored, with the exact decimal and no imageUrl', async () => {
		const { result } = openAt(2)
		act(() => result.current.form.setFieldValue('name', 'Edited draft'))
		await submit(result)
		expect(calls).toHaveLength(0)
		act(() => result.current.scope.restore())
		expect(result.current.scope.isCurrent).toBe(true)
		expect(result.current.form.state.values.name).toBe('Edited draft')
		await submit(result)
		expect(calls).toHaveLength(1)
		expect(calls[0]).toMatchObject({ method: 'PUT', header: '1' })
		expect(calls[0]!.body).toEqual({
			id: 1,
			sku: 'MNU-1',
			name: 'Edited draft',
			categoryId: 125,
			basePrice: '82340.500125',
			status: 'active',
		})
	})

	it('create pins the selected location and refuses once the header moves', async () => {
		const { result } = openAt(1, null)
		expect(result.current.scope.location?.id).toBe(1)
		act(() => {
			result.current.form.setFieldValue('sku', 'NEW-1')
			result.current.form.setFieldValue('name', 'New item')
			result.current.form.setFieldValue('basePrice', '12000.50')
			result.current.context.switchLocation(2)
		})
		await submit(result)
		expect(calls).toHaveLength(0)
		act(() => result.current.scope.restore())
		await submit(result)
		expect(calls).toHaveLength(1)
		expect(calls[0]).toMatchObject({ method: 'POST', header: '1' })
		expect(calls[0]!.body).toEqual({
			locationId: 1,
			sku: 'NEW-1',
			name: 'New item',
			categoryId: null,
			basePrice: '12000.50',
			status: 'active',
		})
	})

	it('refuses to save without the scoped write permission', async () => {
		permission.allowed = false
		const { result } = openAt(1)
		await submit(result)
		expect(calls).toHaveLength(0)
		expect(result.current.form.state.errorMap.onSubmit).toBeDefined()
	})
})

describe('menu item editor save lifecycle', () => {
	it('retains the draft after a server error and retries successfully', async () => {
		const done = vi.fn<() => void>()
		localStorage.setItem('ikki-active-location-id', '1')
		const { result: scoped } = renderHook(() => useSession(item, done), { wrapper })
		respond = async () => new Response(JSON.stringify({ success: false }), { status: 500 })
		act(() => scoped.current.form.setFieldValue('name', 'Draft kept'))
		await submit(scoped)
		expect(done).not.toHaveBeenCalled()
		expect(scoped.current.form.state.values.name).toBe('Draft kept')
		expect(scoped.current.form.state.errorMap.onSubmit).toBeDefined()
		respond = async () => ok()
		await submit(scoped)
		expect(done).toHaveBeenCalledTimes(1)
		expect(calls).toHaveLength(2)
	})

	it('reports submitting while the save is in flight and refetched defaults do not overwrite the draft', async () => {
		const gate = Promise.withResolvers<Response>()
		respond = () => gate.promise
		localStorage.setItem('ikki-active-location-id', '1')
		const { result, rerender } = renderHook(({ record }) => useSession(record), {
			wrapper,
			initialProps: { record: item },
		})
		act(() => result.current.form.setFieldValue('name', 'Draft'))
		rerender({ record: { ...item, name: 'Server refreshed' } })
		expect(result.current.form.state.values.name).toBe('Draft')
		let pending!: Promise<void>
		act(() => {
			pending = result.current.form.handleSubmit()
		})
		await vi.waitFor(() => expect(result.current.form.state.isSubmitting).toBe(true))
		gate.resolve(ok())
		await act(async () => {
			await pending
		})
		expect(result.current.form.state.isSubmitting).toBe(false)
	})
})
