// @vitest-environment jsdom
/// <reference lib="es2024.promise" />
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setActiveLocationAccessor } from '@/lib/api/active-location'

import type { MenuCategoryDto } from '../dto/index.ts'
import { CategoryFormBody } from './category-form.tsx'

const category: MenuCategoryDto = {
	id: 9,
	locationId: 1,
	name: 'Minuman',
	parentId: 4,
	sortOrder: 3,
	createdAt: new Date('2026-01-01'),
	updatedAt: new Date('2026-01-01'),
	createdBy: 1,
	updatedBy: 1,
}

let client: QueryClient
let calls: { method: string; body: unknown }[] = []
let respond: () => Promise<Response>
let active: number | null

const ok = () =>
	new Response(JSON.stringify({ success: true, code: 'OK', data: { id: 9 } }), {
		headers: { 'Content-Type': 'application/json' },
	})

beforeEach(() => {
	vi.stubGlobal('localStorage', { getItem: () => null })
	client = new QueryClient()
	calls = []
	active = 1
	respond = async () => ok()
	setActiveLocationAccessor(() => active)
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(async (_url, init) => {
			calls.push({
				method: init?.method ?? 'GET',
				body: init?.body ? JSON.parse(String(init.body)) : undefined,
			})
			return respond()
		}),
	)
})

afterEach(() => {
	cleanup()
	vi.unstubAllGlobals()
	client.clear()
	setActiveLocationAccessor(() => null)
})

function open(
	props: {
		category?: MenuCategoryDto
		location?: { id: number; name: string }
		canSave?: () => boolean
		onSaved?: () => void
	} = {},
) {
	return render(
		<QueryClientProvider client={client}>
			<CategoryFormBody
				category={props.category}
				location={props.location ?? { id: 1, name: 'Kemang' }}
				canSave={props.canSave ?? (() => true)}
				onSaved={props.onSaved ?? (() => {})}
				onCancel={() => {}}
			/>
		</QueryClientProvider>,
	)
}

const name = () => screen.getByLabelText('Nama Kategori') as HTMLInputElement
const save = () => screen.getByRole('button', { name: /Simpan/u })

describe('category form', () => {
	it('creates with trimmed name, normalized sort order and no parentId', async () => {
		const onSaved = vi.fn<() => void>()
		open({ onSaved })
		fireEvent.change(name(), { target: { value: '  Makanan  ' } })
		fireEvent.click(save())
		await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
		expect(calls).toHaveLength(1)
		expect(calls[0]?.method).toBe('POST')
		expect(calls[0]?.body).toEqual({ locationId: 1, name: 'Makanan', sortOrder: 0 })
	})

	it('updates an existing category using its own location and omits parentId', async () => {
		const onSaved = vi.fn<() => void>()
		open({ category, location: { id: 2, name: 'BSD' }, onSaved })
		fireEvent.change(name(), { target: { value: 'Minuman Dingin' } })
		fireEvent.click(save())
		await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
		expect(calls[0]?.method).toBe('PUT')
		expect(calls[0]?.body).toEqual({ id: 9, name: 'Minuman Dingin', sortOrder: 3 })
	})

	it('keeps the draft after a server error and retries the unchanged values', async () => {
		const onSaved = vi.fn<() => void>()
		open({ onSaved })
		respond = async () => new Response(JSON.stringify({ success: false }), { status: 500 })
		fireEvent.change(name(), { target: { value: 'Draft' } })
		fireEvent.click(save())
		await waitFor(() => expect(calls).toHaveLength(1))
		await screen.findByRole('button', { name: 'Coba lagi' })
		expect(onSaved).not.toHaveBeenCalled()
		expect(name().value).toBe('Draft')
		respond = async () => ok()
		fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
		await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
		expect(calls).toHaveLength(2)
		expect(calls[1]?.body).toEqual(calls[0]?.body)
	})

	it('sends no request when the active location differs from the pinned one, keeping the draft', async () => {
		open({ category })
		active = 2
		fireEvent.change(name(), { target: { value: 'Draft' } })
		fireEvent.click(save())
		await waitFor(() => expect(screen.getByText(/Lokasi aktif telah berubah/u)).toBeTruthy())
		expect(calls).toHaveLength(0)
		expect(name().value).toBe('Draft')
	})

	it('sends no request when permission is revoked after the form opened', async () => {
		let allowed = true
		open({ canSave: () => allowed })
		allowed = false
		fireEvent.change(name(), { target: { value: 'Draft' } })
		fireEvent.click(save())
		await waitFor(() => expect(screen.getByText(/tidak memiliki izin/u)).toBeTruthy())
		expect(calls).toHaveLength(0)
		expect(name().value).toBe('Draft')
	})

	it('is read-only without permission: no submit action and fields disabled', () => {
		open({ category, canSave: () => false })
		expect(screen.queryByRole('button', { name: /Simpan/u })).toBeNull()
		expect(name().matches(':disabled')).toBe(true)
	})

	it('blocks duplicate submits and disables fields while a save is pending', async () => {
		const gate = Promise.withResolvers<Response>()
		respond = () => gate.promise
		const onSaved = vi.fn<() => void>()
		open({ onSaved })
		fireEvent.change(name(), { target: { value: 'Makanan' } })
		fireEvent.click(save())
		await waitFor(() => expect(save().matches(':disabled')).toBe(true))
		fireEvent.click(save())
		expect(name().matches(':disabled')).toBe(true)
		expect(screen.getByRole('button', { name: 'Cancel' }).matches(':disabled')).toBe(true)
		gate.resolve(ok())
		await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
		expect(calls).toHaveLength(1)
	})
})
