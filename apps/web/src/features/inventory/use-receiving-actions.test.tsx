// @vitest-environment jsdom
/// <reference lib="es2024.promise" />
import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, setActiveLocationAccessor } from '@/lib/api'

import { stockKeys, movementKeys } from './api'
import { useReceivingConfirmation } from './use-receiving-actions.ts'

const mocks = vi.hoisted(() => ({
	allowed: true,
	toasts: [] as string[],
	dialogs: [] as { title: string; description: string }[],
}))

vi.mock('@/components/shared/permission-gate', () => ({
	usePermissionCheck: () => mocks.allowed,
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

const receiving = { id: 7, receivingNo: 'RCV-7', locationId: 1, status: 'draft' as const }

let client: QueryClient
let activeLocation: number | null
let calls: { url: string; method: string; body: unknown }[]
let detailStatus: 'draft' | 'confirmed'
let detailResponse: () => Promise<Response>

const json = (data: unknown) =>
	new Response(JSON.stringify({ success: true, code: 'OK', data }), {
		headers: { 'Content-Type': 'application/json' },
	})

const detailBody = () => ({
	id: 7,
	receivingNo: 'RCV-7',
	locationId: 1,
	supplierId: 3,
	status: detailStatus,
	notes: null,
	receivedBy: null,
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
	mocks.allowed = true
	mocks.toasts = []
	mocks.dialogs = []
	activeLocation = 1
	setActiveLocationAccessor(() => activeLocation)
	calls = []
	detailStatus = 'draft'
	detailResponse = async () => json(detailBody())
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(async (url, init) => {
			const method = init?.method ?? 'GET'
			calls.push({
				url: String(url),
				method,
				body: init?.body ? JSON.parse(String(init.body)) : undefined,
			})
			return method === 'POST' ? json({ id: 7 }) : detailResponse()
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

const mount = () => renderHook(() => useReceivingConfirmation(), { wrapper })

describe('receiving confirmation', () => {
	it('reads the authoritative detail, then confirms the draft exactly once', async () => {
		const { result } = mount()
		let accepted = false
		await act(async () => {
			accepted = await result.current.run(receiving)
		})
		expect(accepted).toBe(true)
		expect(calls.map((call) => call.method)).toEqual(['GET', 'POST'])
		expect(writes()[0]!.body).toEqual({ receivingId: 7 })
		expect(mocks.dialogs[0]!.description).toContain('RCV-7')
		expect(mocks.toasts).toEqual(['Penerimaan berhasil dikonfirmasi.'])
	})

	it.each([
		['wrong active location', () => (activeLocation = 2)],
		['All Locations', () => (activeLocation = null)],
		['missing permission', () => (mocks.allowed = false)],
	])('never opens or writes under %s', async (_name, change) => {
		change()
		const { result } = mount()
		let accepted = true
		await act(async () => {
			accepted = await result.current.run(receiving)
		})
		expect(accepted).toBe(false)
		expect(mocks.dialogs).toHaveLength(0)
		expect(calls).toHaveLength(0)
	})

	it('does not offer a receiving that is not a draft', async () => {
		const { result } = mount()
		await act(async () => {
			await result.current.run({ ...receiving, status: 'confirmed' })
		})
		expect(calls).toHaveLength(0)
		expect(mocks.dialogs).toHaveLength(0)
	})

	it('does not write when the pre-read fails, and a retry reads again before the single write', async () => {
		detailResponse = async () => new Response('down', { status: 503 })
		const { result } = mount()
		await act(async () => {
			await expect(result.current.run(receiving)).rejects.toThrow(ApiError)
		})
		expect(writes()).toHaveLength(0)
		expect(mocks.toasts).toHaveLength(0)

		detailResponse = async () => json(detailBody())
		await act(async () => {
			await result.current.run(receiving)
		})
		expect(calls.filter((call) => call.method === 'GET')).toHaveLength(2)
		expect(writes()).toHaveLength(1)
	})

	it('does not repeat the write when the receiving was already confirmed (lost response)', async () => {
		detailStatus = 'confirmed'
		const { result } = mount()
		const keys = [
			stockKeys.list({ locationId: 1 }),
			movementKeys.list({ locationId: 1, materialId: 225 }),
			['audit/by-entity', { entity: 'receiving', entityId: 7 }],
		]
		for (const key of keys) client.setQueryData(key, { data: [] })
		await act(async () => {
			await result.current.run(receiving)
		})
		expect(writes()).toHaveLength(0)
		expect(mocks.toasts).toEqual(['Penerimaan berhasil dikonfirmasi.'])
		for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(true)
	})

	it('refuses to write when the active location changes during the pre-read', async () => {
		detailResponse = async () => {
			activeLocation = 2
			return json(detailBody())
		}
		const { result } = mount()
		await act(async () => {
			await expect(result.current.run(receiving)).rejects.toThrow('Lokasi aktif')
		})
		expect(writes()).toHaveLength(0)
		expect(mocks.toasts).toHaveLength(0)
	})

	it('refuses when the authoritative record belongs to another location', async () => {
		detailResponse = async () => json({ ...detailBody(), locationId: 2 })
		const { result } = mount()
		await act(async () => {
			await expect(result.current.run(receiving)).rejects.toThrow('bukan milik lokasi aktif')
		})
		expect(writes()).toHaveLength(0)
	})

	it('ignores a second confirmation while one is in flight', async () => {
		const gate = Promise.withResolvers<Response>()
		detailResponse = () => gate.promise
		const release = () => gate.resolve(json(detailBody()))
		const { result } = mount()
		let first: Promise<boolean> = Promise.resolve(false)
		let second = true
		await act(async () => {
			first = result.current.run(receiving)
			second = await result.current.run(receiving)
		})
		expect(second).toBe(false)
		await act(async () => {
			release()
			await first
		})
		expect(writes()).toHaveLength(1)
		expect(mocks.dialogs).toHaveLength(1)
	})
})
