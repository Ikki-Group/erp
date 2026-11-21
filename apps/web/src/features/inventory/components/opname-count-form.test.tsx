// @vitest-environment jsdom
/// <reference lib="es2024.promise" />
import type { ReactNode } from 'react'

import { QueryClientProvider, useQuery } from '@tanstack/react-query'

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setActiveLocationAccessor } from '@/lib/api/active-location'
import type { PinnedEditorLocationScope } from '@/lib/form/use-editor-location-scope'
import { queryClient } from '@/lib/tanstack-query'

import { opnameResource } from '../api'
import type { OpnameDetailDto } from '../dto/index.ts'
import { OpnameCountForm } from './opname-count-form.tsx'

vi.mock('@/lib/form/use-unsaved-changes-guard.ts', () => ({ useUnsavedChangesGuard: () => {} }))

const scope: PinnedEditorLocationScope = {
	location: { id: 1, name: 'Kemang' },
	isCurrent: true,
	canRestore: true,
	restore: () => {},
}

const date = new Date('2026-01-01')
const opname: OpnameDetailDto = {
	id: 1,
	opnameNo: 'OPN-1',
	locationId: 1,
	status: 'draft',
	startedAt: null,
	completedAt: null,
	conductedBy: null,
	createdAt: date,
	updatedAt: date,
	createdBy: 1,
	updatedBy: 1,
	lines: [
		{
			id: 11,
			opnameId: 1,
			materialId: 21,
			materialCode: 'M-1',
			materialName: 'Gula',
			systemQty: '2.500125',
			actualQty: '0',
			reason: 'Keep zero reason',
		},
		{
			id: 12,
			opnameId: 1,
			materialId: 22,
			materialCode: 'M-2',
			materialName: 'Susu',
			systemQty: '9007199254740993.500125',
			actualQty: '9007199254740993.500000',
			reason: null,
		},
	],
}

const client = queryClient
let calls: { method: string; body: unknown }[] = []
let putStatus = 200
let serverStatus: string = 'draft'
let afterWriteRead: (() => Promise<Response>) | undefined
let written = false

beforeEach(() => {
	client.clear()
	afterWriteRead = undefined
	written = false
	calls = []
	putStatus = 200
	serverStatus = 'draft'
	setActiveLocationAccessor(() => 1)
	vi.stubGlobal('localStorage', { getItem: () => null })
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(async (_url, init) => {
			const method = init?.method ?? 'GET'
			calls.push({ method, body: init?.body ? JSON.parse(String(init.body)) : undefined })
			if (method === 'GET') {
				if (written && afterWriteRead) return afterWriteRead()
				return Response.json({
					success: true,
					code: 'OK',
					data: { ...opname, status: serverStatus },
				})
			}
			if (putStatus !== 200) return Response.json({ success: false }, { status: putStatus })
			written = true
			return Response.json({ success: true, code: 'OK', data: { id: 1 } })
		}),
	)
})

afterEach(() => {
	cleanup()
	vi.unstubAllGlobals()
	client.clear()
	setActiveLocationAccessor(() => null)
})

function ui(props: Partial<React.ComponentProps<typeof OpnameCountForm>> = {}): ReactNode {
	return (
		<QueryClientProvider client={client}>
			<OpnameCountForm
				opname={opname}
				scope={scope}
				canUpdate
				canComplete
				completing={false}
				onComplete={async () => true}
				{...props}
			/>
		</QueryClientProvider>
	)
}

function QueryBoundCountForm() {
	const query = useQuery({
		...opnameResource.detail.queryOptions({ id: opname.id }),
		initialData: { success: true as const, code: 'OK', data: opname },
		staleTime: Infinity,
		retry: false,
		throwOnError: false,
	})
	return (
		<OpnameCountForm
			opname={query.data!.data}
			scope={scope}
			canUpdate
			canComplete
			completing={false}
			onComplete={async () => true}
		/>
	)
}

const qty = (name: string) => screen.getByLabelText(`Jumlah aktual ${name}`) as HTMLInputElement
const reason = (name: string) => screen.getByLabelText(`Alasan ${name}`) as HTMLInputElement
const save = () => screen.getByRole('button', { name: /simpan hitungan|coba simpan lagi/iu })
const complete = () => screen.getByRole('button', { name: 'Selesaikan Opname' })
const puts = () => calls.filter((c) => c.method === 'PUT')

describe('OpnameCountForm', () => {
	it('shows persisted zero, reasons, and exact variance', () => {
		render(ui())
		expect(qty('Gula').value).toBe('0')
		expect(reason('Gula').value).toBe('Keep zero reason')
		expect(screen.getByText('-2.500125')).toBeTruthy()
		expect(screen.getByText('-0.000125')).toBeTruthy()
		expect(save()).toHaveProperty('disabled', true)
		expect(complete()).toHaveProperty('disabled', false)
	})

	it('blocks completion while edits are unsaved and sends only the changed line with its reason', async () => {
		const { rerender } = render(ui())
		fireEvent.change(qty('Gula'), { target: { value: '1.25' } })
		expect(complete()).toHaveProperty('disabled', true)
		// A refetch with different server data does not replace the draft.
		rerender(
			ui({
				opname: { ...opname, lines: [{ ...opname.lines[0]!, actualQty: '99' }, opname.lines[1]!] },
			}),
		)
		expect(qty('Gula').value).toBe('1.25')

		fireEvent.click(save())
		await waitFor(() => expect(puts()).toHaveLength(1))
		expect(puts()[0]!.body).toEqual({
			opnameId: 1,
			lines: [{ materialId: 21, countedQty: '1.25', reason: 'Keep zero reason' }],
		})
		await waitFor(() => expect(save()).toHaveProperty('disabled', true))
		rerender(
			ui({
				opname: {
					...opname,
					lines: [{ ...opname.lines[0]!, actualQty: '1.25' }, opname.lines[1]!],
				},
			}),
		)
		expect(complete()).toHaveProperty('disabled', false)
		expect(qty('Gula').value).toBe('1.25')
		expect(save()).toHaveProperty('disabled', true)

		fireEvent.change(qty('Gula'), { target: { value: '2' } })
		expect(save()).toHaveProperty('disabled', false)
		expect(complete()).toHaveProperty('disabled', true)
	})

	it('clears a reason to null', async () => {
		render(ui())
		fireEvent.change(reason('Gula'), { target: { value: '' } })
		fireEvent.click(save())
		await waitFor(() => expect(puts()).toHaveLength(1))
		expect(puts()[0]!.body).toEqual({
			opnameId: 1,
			lines: [{ materialId: 21, countedQty: '0', reason: null }],
		})
	})

	it('keeps the draft after a failure and retries the same values', async () => {
		render(ui())
		fireEvent.change(qty('Susu'), { target: { value: '9007199254740993.500001' } })
		putStatus = 500
		fireEvent.click(save())
		await screen.findByRole('button', { name: 'Coba simpan lagi' })
		expect(qty('Susu').value).toBe('9007199254740993.500001')
		expect(complete()).toHaveProperty('disabled', true)
		putStatus = 200
		fireEvent.click(screen.getByRole('button', { name: 'Coba simpan lagi' }))
		await waitFor(() => expect(puts()).toHaveLength(2))
		expect(puts()[1]!.body).toEqual(puts()[0]!.body)
	})

	it('refuses to save over a terminal record and keeps the draft', async () => {
		render(ui())
		fireEvent.change(qty('Gula'), { target: { value: '4' } })
		serverStatus = 'completed'
		fireEvent.click(save())
		await screen.findByRole('button', { name: 'Coba simpan lagi' })
		expect(puts()).toHaveLength(0)
		expect(qty('Gula').value).toBe('4')
	})

	it('rejects empty counts instead of treating them as zero', async () => {
		render(ui())
		fireEvent.change(qty('Gula'), { target: { value: '' } })
		fireEvent.click(save())
		await waitFor(() => expect(qty('Gula').getAttribute('aria-invalid')).toBe('true'))
		expect(puts()).toHaveLength(0)
	})

	it('requires explicit review of refreshed saved counts before completion', () => {
		const { rerender } = render(ui())
		rerender(
			ui({
				opname: { ...opname, lines: [{ ...opname.lines[0]!, actualQty: '99' }, opname.lines[1]!] },
			}),
		)
		expect(qty('Gula').value).toBe('0')
		expect(complete()).toHaveProperty('disabled', true)
		fireEvent.click(screen.getByRole('button', { name: 'Muat hitungan terbaru' }))
		expect(qty('Gula').value).toBe('99')
		expect(complete()).toHaveProperty('disabled', false)
	})

	it('keeps acknowledged counts after a held detail refetch fails, including a remount', async () => {
		const refresh = Promise.withResolvers<Response>()
		afterWriteRead = () => refresh.promise
		const mount = () =>
			render(
				<QueryClientProvider client={client}>
					<QueryBoundCountForm />
				</QueryClientProvider>,
			)
		const view = mount()
		fireEvent.change(qty('Gula'), { target: { value: '1.25' } })
		fireEvent.click(save())
		await waitFor(() => expect(puts()).toHaveLength(1))
		await waitFor(() => expect(calls.filter((call) => call.method === 'GET')).toHaveLength(2))
		expect(save()).toHaveProperty('disabled', true)
		expect(complete()).toHaveProperty('disabled', true)
		expect(screen.queryByRole('button', { name: 'Muat hitungan terbaru' })).toBeNull()
		await act(async () => {
			refresh.resolve(new Response('unavailable', { status: 503 }))
		})
		await waitFor(() => expect(complete()).toHaveProperty('disabled', false))
		expect(client.getQueryState(opnameResource.detail.queryKey({ id: opname.id }))?.status).toBe(
			'error',
		)
		expect(
			client.getQueryState(opnameResource.detail.queryKey({ id: opname.id }))?.isInvalidated,
		).toBe(true)
		expect(qty('Gula').value).toBe('1.25')
		expect(reason('Gula').value).toBe('Keep zero reason')
		expect(qty('Susu').value).toBe('9007199254740993.500000')
		expect(screen.queryByRole('button', { name: 'Muat hitungan terbaru' })).toBeNull()
		view.unmount()
		mount()
		expect(qty('Gula').value).toBe('1.25')
	})

	it.each(['42', '0'])(
		'keeps a successful server refresh of %s instead of the submitted counts',
		async (actualQty) => {
			const refresh = Promise.withResolvers<Response>()
			afterWriteRead = () => refresh.promise
			render(
				<QueryClientProvider client={client}>
					<QueryBoundCountForm />
				</QueryClientProvider>,
			)
			fireEvent.change(qty('Gula'), { target: { value: '1.25' } })
			fireEvent.click(save())
			await waitFor(() => expect(calls.filter((call) => call.method === 'GET')).toHaveLength(2))
			await act(async () => {
				refresh.resolve(
					Response.json({
						success: true,
						code: 'OK',
						data: { ...opname, lines: [{ ...opname.lines[0]!, actualQty }, opname.lines[1]!] },
					}),
				)
			})
			const loadLatest = await screen.findByRole('button', { name: 'Muat hitungan terbaru' })
			expect(complete()).toHaveProperty('disabled', true)
			expect(qty('Gula').value).toBe('1.25')
			fireEvent.click(loadLatest)
			expect(qty('Gula').value).toBe(actualQty)
		},
	)

	it('is read-only when completed', () => {
		render(ui({ opname: { ...opname, status: 'completed' } }))
		expect(screen.queryByLabelText('Jumlah aktual Gula')).toBeNull()
		expect(screen.queryByRole('button', { name: 'Selesaikan Opname' })).toBeNull()
	})
})
