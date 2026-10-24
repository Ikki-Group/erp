// @vitest-environment jsdom
/// <reference lib="es2024.promise" />
import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, setActiveLocationAccessor } from '@/lib/api'

import { stockKeys, movementKeys } from './api'
import { useOpnameActions, type OpnameCompletionRef } from './use-opname-actions.ts'

const mocks = vi.hoisted(() => ({
	permissions: new Set<string>(),
	toasts: [] as string[],
	dialogs: [] as { title: string; description: string }[],
}))

vi.mock('@/components/shared/permission-gate', () => ({
	usePermissionCheck: ({ permission }: { permission: string }) => mocks.permissions.has(permission),
}))
vi.mock('@/components/ui/toast', () => ({
	toast: { add: ({ title }: { title: string }) => mocks.toasts.push(title) },
}))
// The dialog runs onConfirm once and surfaces a rejection, as the real dialog does for retry.
vi.mock('@/components/shared/confirm', () => ({
	confirm: async (options: {
		title: string
		description: string
		onConfirm: () => Promise<void>
	}) => {
		mocks.dialogs.push({ title: options.title, description: options.description })
		await options.onConfirm()
		return true
	},
}))

const opname: OpnameCompletionRef = {
	id: 7,
	opnameNo: 'OPN-7',
	locationId: 1,
	status: 'draft',
	expectedCounts: { lines: [] },
}
const location = { id: 1, name: 'Kemang' }

let client: QueryClient
let activeLocation: number | null
let calls: { url: string; method: string; body: unknown }[]
let detailStatus: string
let detailResponse: () => Promise<Response>
let writeResponse: () => Promise<Response>

const json = (data: unknown) =>
	new Response(JSON.stringify({ success: true, code: 'OK', data }), {
		headers: { 'Content-Type': 'application/json' },
	})

const detailBody = () => ({
	id: 7,
	opnameNo: 'OPN-7',
	locationId: 1,
	status: detailStatus,
	startedAt: null,
	completedAt: null,
	conductedBy: null,
	notes: null,
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
	createdBy: 1,
	updatedBy: 1,
	lines: [],
})

const writes = () => calls.filter((call) => call.method === 'POST')

beforeEach(() => {
	const storage = new Map<string, string>()
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => storage.set(key, value),
		removeItem: (key: string) => storage.delete(key),
		clear: () => storage.clear(),
	})
	client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
	mocks.permissions = new Set(['opname.create', 'opname.complete'])
	mocks.toasts = []
	mocks.dialogs = []
	activeLocation = 1
	setActiveLocationAccessor(() => activeLocation)
	calls = []
	detailStatus = 'draft'
	detailResponse = async () => json(detailBody())
	writeResponse = async () => json({ id: 7 })
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(async (url, init) => {
			const method = init?.method ?? 'GET'
			calls.push({
				url: String(url),
				method,
				body: init?.body ? JSON.parse(String(init.body)) : undefined,
			})
			return method === 'POST' ? writeResponse() : detailResponse()
		}),
	)
})

afterEach(() => {
	cleanup()
	vi.unstubAllGlobals()
	client.clear()
	setActiveLocationAccessor(() => null)
})

function wrapper({ children }: { children: ReactNode }) {
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const mount = (onCreated?: (id: number) => void | Promise<void>) =>
	renderHook(() => useOpnameActions({ onCreated }), { wrapper })

describe('opname completion', () => {
	it('reads the authoritative draft, then completes it exactly once', async () => {
		const { result } = mount()
		let accepted = false
		await act(async () => {
			accepted = await result.current.complete(opname)
		})
		expect(accepted).toBe(true)
		expect(calls.map((call) => call.method)).toEqual(['GET', 'POST'])
		expect(writes()[0]!.body).toEqual({ opnameId: 7 })
		expect(mocks.toasts).toHaveLength(1)
	})

	it.each(['in_progress', 'completed', 'cancelled'] as const)(
		'does not offer a %s opname',
		async (status) => {
			const { result } = mount()
			let accepted = true
			await act(async () => {
				accepted = await result.current.complete({ ...opname, status })
			})
			expect(accepted).toBe(false)
			expect(calls).toHaveLength(0)
			expect(mocks.dialogs).toHaveLength(0)
		},
	)

	it.each([
		['wrong active location', () => (activeLocation = 2)],
		['All Locations', () => (activeLocation = null)],
		['missing permission', () => mocks.permissions.delete('opname.complete')],
	])('never opens or writes under %s', async (_name, change) => {
		change()
		const { result } = mount()
		let accepted = true
		await act(async () => {
			accepted = await result.current.complete(opname)
		})
		expect(accepted).toBe(false)
		expect(mocks.dialogs).toHaveLength(0)
		expect(calls).toHaveLength(0)
	})

	it('refuses to write when the active location changes during the pre-read', async () => {
		detailResponse = async () => {
			activeLocation = 2
			return json(detailBody())
		}
		const { result } = mount()
		await act(async () => {
			await expect(result.current.complete(opname)).rejects.toThrow('Lokasi aktif')
		})
		expect(writes()).toHaveLength(0)
		expect(mocks.toasts).toHaveLength(0)
	})

	it('refuses when the authoritative record belongs to another location', async () => {
		detailResponse = async () => json({ ...detailBody(), locationId: 2 })
		const { result } = mount()
		await act(async () => {
			await expect(result.current.complete(opname)).rejects.toThrow('bukan milik lokasi aktif')
		})
		expect(writes()).toHaveLength(0)
	})

	it('refuses an opname that is no longer a draft on the server', async () => {
		detailStatus = 'cancelled'
		const { result } = mount()
		await act(async () => {
			await expect(result.current.complete(opname)).rejects.toThrow('tidak lagi berstatus draft')
		})
		expect(writes()).toHaveLength(0)
	})

	it('does not write when the pre-read fails, and a retry reads again before the single write', async () => {
		detailResponse = async () => new Response('down', { status: 503 })
		const { result } = mount()
		await act(async () => {
			await expect(result.current.complete(opname)).rejects.toThrow(ApiError)
		})
		expect(writes()).toHaveLength(0)
		expect(mocks.toasts).toHaveLength(0)

		detailResponse = async () => json(detailBody())
		await act(async () => {
			await result.current.complete(opname)
		})
		expect(calls.filter((call) => call.method === 'GET')).toHaveLength(2)
		expect(writes()).toHaveLength(1)
	})

	it('refuses to complete saved counts the operator has not reviewed', async () => {
		const { result } = mount()
		await act(async () => {
			await expect(
				result.current.complete({
					...opname,
					expectedCounts: { lines: [{ lineId: 1, materialId: 2, countedQty: '0', reason: '' }] },
				}),
			).rejects.toThrow('Hitungan tersimpan telah berubah')
		})
		expect(writes()).toHaveLength(0)
	})

	it('does not repeat the write when already completed (lost response) and refreshes stock readers', async () => {
		detailStatus = 'completed'
		const { result } = mount()
		const keys = [
			stockKeys.list({ locationId: 1 }),
			movementKeys.list({ locationId: 1, materialId: 225 }),
			['audit/by-entity', { entity: 'opname', entityId: 7 }],
		]
		for (const key of keys) client.setQueryData(key, { data: [] })
		await act(async () => {
			await result.current.complete(opname)
		})
		expect(writes()).toHaveLength(0)
		for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(true)
	})

	it('ignores a second completion while one is in flight', async () => {
		const gate = Promise.withResolvers<Response>()
		detailResponse = () => gate.promise
		const { result } = mount()
		let first: Promise<boolean> = Promise.resolve(false)
		let second = true
		await act(async () => {
			first = result.current.complete(opname)
			second = await result.current.complete(opname)
		})
		expect(second).toBe(false)
		await act(async () => {
			gate.resolve(json(detailBody()))
			await first
		})
		expect(writes()).toHaveLength(1)
		expect(mocks.dialogs).toHaveLength(1)
	})
})

describe('opname snapshot creation', () => {
	it('explains the snapshot, creates once, then reports the new id', async () => {
		const onCreated = vi.fn<(id: number) => void>()
		const { result } = mount(onCreated)
		let accepted = false
		await act(async () => {
			accepted = await result.current.create(location)
		})
		expect(accepted).toBe(true)
		expect(writes()).toHaveLength(1)
		expect(writes()[0]!.body).toEqual({ locationId: 1 })
		expect(onCreated).toHaveBeenCalledExactlyOnceWith(7)
	})

	it.each([
		['wrong active location', () => (activeLocation = 2)],
		['All Locations', () => (activeLocation = null)],
		['missing permission', () => mocks.permissions.delete('opname.create')],
	])('never opens or writes under %s', async (_name, change) => {
		change()
		const onCreated = vi.fn<(id: number) => void>()
		const { result } = mount(onCreated)
		let accepted = true
		await act(async () => {
			accepted = await result.current.create(location)
		})
		expect(accepted).toBe(false)
		expect(mocks.dialogs).toHaveLength(0)
		expect(calls).toHaveLength(0)
		expect(onCreated).not.toHaveBeenCalled()
	})

	it('refuses to write when the scope changes while the dialog is open', async () => {
		const onCreated = vi.fn<(id: number) => void>()
		const { result } = mount(onCreated)
		// The scope changes after availability passed but before the confirmed execution starts.
		setActiveLocationAccessor(vi.fn<() => number>().mockReturnValueOnce(1).mockReturnValue(2))
		await act(async () => {
			await expect(result.current.create(location)).rejects.toThrow('Lokasi aktif')
		})
		expect(writes()).toHaveLength(0)
		expect(onCreated).not.toHaveBeenCalled()
	})

	it('ignores a second create while one is in flight', async () => {
		const gate = Promise.withResolvers<Response>()
		writeResponse = () => gate.promise
		const onCreated = vi.fn<(id: number) => void>()
		const { result } = mount(onCreated)
		let first: Promise<boolean> = Promise.resolve(false)
		let second = true
		await act(async () => {
			first = result.current.create(location)
			second = await result.current.create(location)
		})
		expect(second).toBe(false)
		await act(async () => {
			gate.resolve(json({ id: 9 }))
			await first
		})
		expect(writes()).toHaveLength(1)
		expect(onCreated).toHaveBeenCalledExactlyOnceWith(9)
	})

	it('surfaces a failed create without the callback and without retrying', async () => {
		writeResponse = async () => new Response('down', { status: 503 })
		const onCreated = vi.fn<(id: number) => void>()
		const { result } = mount(onCreated)
		await act(async () => {
			await expect(result.current.create(location)).rejects.toThrow(ApiError)
		})
		expect(writes()).toHaveLength(1)
		expect(onCreated).not.toHaveBeenCalled()
		expect(mocks.toasts).toHaveLength(0)
	})
})
