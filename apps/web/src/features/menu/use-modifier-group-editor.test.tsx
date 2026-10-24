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

import type { ModifierGroupWithOptionsDto } from './dto/index.ts'
import { createModifierOption } from './modifier-group-form-values'
import type { ModifierGroupFormValues } from './modifier-group-form-values'
import { useModifierGroupEditor } from './use-modifier-group-editor.ts'
import { LocationProvider, useLocationContext } from '@/providers/location-provider'

const permission = vi.hoisted(() => ({ allowed: true, asked: [] as string[] }))
vi.mock('@/components/shared/permission-gate', () => ({
	usePermissionCheck: ({ permission: name }: { permission: string }) => {
		permission.asked.push(name)
		return permission.allowed
	},
}))

const locations: AuthLocation[] = [
	{ id: 1, name: 'Kemang', code: 'KMG', type: 'store' },
	{ id: 2, name: 'BSD', code: 'BSD', type: 'store' },
]

const group: ModifierGroupWithOptionsDto = {
	id: 7,
	locationId: 1,
	name: 'Ukuran',
	selectionType: 'single',
	isRequired: false,
	minSelect: 0,
	maxSelect: 1,
	options: [
		{
			id: 1,
			groupId: 7,
			name: 'Kecil',
			priceAdjustment: '0',
			isDefault: true,
			sortOrder: 0,
			isActive: true,
		},
		{
			id: 2,
			groupId: 7,
			name: 'Sedang',
			priceAdjustment: '2500.5',
			isDefault: false,
			sortOrder: 1,
			isActive: false,
		},
		{
			id: 3,
			groupId: 7,
			name: 'Besar',
			priceAdjustment: '-1000',
			isDefault: false,
			sortOrder: 2,
			isActive: true,
		},
	],
	createdAt: new Date('2026-01-01'),
	updatedAt: new Date('2026-01-01'),
	createdBy: 1,
	updatedBy: 1,
}

let client: QueryClient
let calls: { url: string; method: string; body: unknown; header: string | null }[] = []
let respond: () => Promise<Response>

const ok = () =>
	new Response(JSON.stringify({ success: true, code: 'OK', data: { id: 7 } }), {
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
	client = new QueryClient()
	permission.allowed = true
	permission.asked = []
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

function useSession(record: ModifierGroupWithOptionsDto | undefined, onSaved = () => {}) {
	const scope = useEditorLocationScope(record?.locationId)
	const context = useLocationContext()
	setActiveLocationAccessor(() => context.activeLocation?.id ?? null)
	const form = useModifierGroupEditor({ group: record, location: scope.location!, onSaved })
	return { scope, context, form }
}

function openAt(header: number | null, record: ModifierGroupWithOptionsDto | null = group) {
	if (header !== null) localStorage.setItem('ikki-active-location-id', String(header))
	return renderHook(() => useSession(record ?? undefined), { wrapper })
}

const submit = (result: { current: { form: EntityForm<ModifierGroupFormValues> } }) =>
	act(async () => {
		await result.current.form.handleSubmit()
	})

describe('modifier group editor location scope', () => {
	it.each([2, null])(
		'edit opened under header %s pins the group location and refuses to save, keeping the draft',
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

	it('saves only after restore and replaces every option with exact flags and no identifiers', async () => {
		const { result } = openAt(2)
		act(() => result.current.form.setFieldValue('name', 'Edited draft'))
		await submit(result)
		expect(calls).toHaveLength(0)
		act(() => result.current.scope.restore())
		await submit(result)
		expect(calls).toHaveLength(1)
		expect(calls[0]).toMatchObject({ method: 'PUT', header: '1' })
		expect(calls[0]!.body).toEqual({
			id: 7,
			name: 'Edited draft',
			selectionType: 'single',
			isRequired: false,
			minSelect: 0,
			maxSelect: 1,
			options: [
				{ name: 'Kecil', priceAdjustment: '0', isDefault: true, sortOrder: 0, isActive: true },
				{
					name: 'Sedang',
					priceAdjustment: '2500.5',
					isDefault: false,
					sortOrder: 1,
					isActive: false,
				},
				{ name: 'Besar', priceAdjustment: '-1000', isDefault: false, sortOrder: 2, isActive: true },
			],
		})
	})

	it('create pins the selected location and refuses once the header moves', async () => {
		const { result } = openAt(1, null)
		act(() => {
			result.current.form.setFieldValue('name', 'Gula')
			result.current.form.setFieldValue('options[0].name', 'Normal')
			result.current.context.switchLocation(2)
		})
		await submit(result)
		expect(calls).toHaveLength(0)
		act(() => result.current.scope.restore())
		await submit(result)
		expect(calls[0]).toMatchObject({ method: 'POST', header: '1' })
		expect(calls[0]!.body).toMatchObject({ locationId: 1, name: 'Gula' })
	})

	it('checks the create or update permission and refuses to save without it', async () => {
		permission.allowed = false
		const edit = openAt(1)
		await submit(edit.result)
		expect(permission.asked).toContain('modifier.update')
		const create = openAt(1, null)
		await submit(create.result)
		expect(permission.asked).toContain('modifier.create')
		expect(calls).toHaveLength(0)
		expect(edit.result.current.form.state.errorMap.onSubmit).toBeDefined()
	})
})

describe('modifier group editor session', () => {
	it('keeps user edits on the surviving rows when another row is deleted', () => {
		const { result } = openAt(1)
		const [first, , third] = result.current.form.state.values.options
		act(() => {
			result.current.form.setFieldValue('options[2].name', 'Jumbo')
			void result.current.form.removeFieldValue('options', 0)
		})
		const options = result.current.form.state.values.options
		expect(options.map((option) => option.clientKey)).not.toContain(first!.clientKey)
		expect(options.find((option) => option.clientKey === third!.clientKey)).toMatchObject({
			name: 'Jumbo',
			priceAdjustment: '-1000',
		})
		expect(options.find((option) => option.name === 'Sedang')).toMatchObject({
			isActive: false,
			sortOrder: 1,
		})
	})

	it('retains the draft after a failure, retries the same values, and ignores refetched detail', async () => {
		const done = vi.fn<() => void>()
		localStorage.setItem('ikki-active-location-id', '1')
		const { result, rerender } = renderHook(({ record }) => useSession(record, done), {
			wrapper,
			initialProps: { record: group },
		})
		act(() => {
			result.current.form.setFieldValue('options[1].isDefault', true)
			result.current.form.pushFieldValue('options', createModifierOption(3))
			result.current.form.setFieldValue('options[3].name', 'Ekstra')
		})
		rerender({ record: { ...group, name: 'Server refreshed', options: [] } })
		expect(result.current.form.state.values.options).toHaveLength(4)
		respond = async () => new Response(JSON.stringify({ success: false }), { status: 500 })
		await submit(result)
		expect(done).not.toHaveBeenCalled()
		expect(result.current.form.state.errorMap.onSubmit).toBeDefined()
		respond = async () => ok()
		await submit(result)
		expect(done).toHaveBeenCalledTimes(1)
		expect(calls).toHaveLength(2)
		expect(calls[1]!.body).toEqual(calls[0]!.body)
		expect(calls[1]!.body).toMatchObject({ name: 'Ukuran' })
	})

	it('reports submitting while a save is in flight', async () => {
		const gate = Promise.withResolvers<Response>()
		respond = () => gate.promise
		const { result } = openAt(1)
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
