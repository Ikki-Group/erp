/// <reference lib="es2024.promise" />
// @vitest-environment jsdom
import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CompanySettingsDto, CompanySettingsUpdateDto } from '../dto/index.ts'
import {
	COMPANY_UPDATE_DENIED,
	toCompanyFormValues,
	toCompanyInput,
	useCompanyForm,
} from './company-form.tsx'

const { update } = vi.hoisted(() => ({
	update: vi.fn<(input: CompanySettingsUpdateDto) => Promise<{ data: { id: number } }>>(),
}))
vi.mock('../api.ts', () => ({ companyUpdate: { fetch: update } }))
vi.mock('@/components/ui/toast', () => ({ toast: { add: vi.fn<() => void>() } }))

const settings: CompanySettingsDto = {
	id: 1,
	name: 'Smoke Company',
	address: null,
	phone: null,
	email: null,
	taxId: null,
	taxRate: '11.00',
	currencyCode: 'IDR',
	currencySymbol: 'Rp',
	logoUrl: '/retained-logo.png',
	receiptFooter: null,
} as CompanySettingsDto

const clients: QueryClient[] = []
beforeEach(() => {
	update.mockReset()
})
afterEach(() => {
	cleanup()
	for (const client of clients) client.clear()
	clients.length = 0
})

function wrapper({ children }: { children: ReactNode }) {
	const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
	clients.push(client)
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function setup(props: { settings?: CompanySettingsDto; canWrite?: boolean } = {}) {
	return renderHook((p: { settings: CompanySettingsDto; canWrite: boolean }) => useCompanyForm(p), {
		initialProps: { settings, canWrite: true, ...props },
		wrapper,
	})
}

describe('company form mapping', () => {
	it('trims, nulls empty optionals, keeps tax precision and retains the hidden logo', () => {
		const input = toCompanyInput(
			{
				...toCompanyFormValues(settings),
				name: '  Acme  ',
				address: '   ',
				email: ' a@b.co ',
				taxRate: '11.50',
			},
			settings,
		)
		expect(input).toMatchObject({
			id: 1,
			name: 'Acme',
			address: null,
			email: 'a@b.co',
			taxRate: '11.50',
			logoUrl: '/retained-logo.png',
		})
	})
})

describe('company settings editing session', () => {
	it('saves on the page, becomes clean against the normalized baseline, and guards later edits', async () => {
		update.mockResolvedValue({ data: { id: 1 } })
		const { result } = setup()
		act(() => result.current.setFieldValue('name', '  Acme  '))
		await act(() => result.current.handleSubmit())
		expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Acme' }))
		expect(result.current.state.values.name).toBe('Acme')
		expect(result.current.state.isDirty).toBe(false)
		expect(result.current.state.isDefaultValue).toBe(true)

		act(() => result.current.setFieldValue('name', 'Acme 2'))
		expect(result.current.state.isDirty).toBe(true)
		await act(() => result.current.handleSubmit())
		expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Acme 2' }))
	})

	it('keeps edits made while the save is in flight as unsaved changes against the saved baseline', async () => {
		let finish: () => void = () => {}
		update.mockImplementation(
			() =>
				new Promise((resolve) => {
					finish = () => resolve({ data: { id: 1 } })
				}),
		)
		const { result } = setup()
		act(() => result.current.setFieldValue('name', 'Saved name'))
		let submitting: Promise<void> = Promise.resolve()
		act(() => {
			submitting = result.current.handleSubmit()
		})
		await vi.waitFor(() => expect(update).toHaveBeenCalled())
		act(() => result.current.setFieldValue('phone', '0812'))
		await act(async () => {
			finish()
			await submitting
		})
		expect(result.current.state.values.name).toBe('Saved name')
		expect(result.current.state.values.phone).toBe('0812')
		expect(result.current.state.isDefaultValue).toBe(false)
		// Reverting the late edit lands exactly on the saved baseline.
		act(() => result.current.setFieldValue('phone', ''))
		expect(result.current.state.isDefaultValue).toBe(true)
	})

	it('keeps the late edit and saved baseline when the refreshed record renders after the save', async () => {
		const saving = Promise.withResolvers<{ data: { id: number } }>()
		update.mockReturnValueOnce(saving.promise)
		const { result, rerender } = setup()
		act(() => result.current.setFieldValue('name', 'Saved name'))
		let submitting: Promise<void> = Promise.resolve()
		act(() => {
			submitting = result.current.handleSubmit()
		})
		await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1))
		act(() => result.current.setFieldValue('phone', '0812'))
		await act(async () => {
			saving.resolve({ data: { id: 1 } })
			await submitting
		})
		rerender({ settings: { ...settings, name: 'Saved name', taxRate: '12.00' }, canWrite: true })
		expect(result.current.state.values.phone).toBe('0812')
		expect(result.current.state.values.name).toBe('Saved name')
		expect(result.current.state.values.taxRate).toBe('11.00')
		expect(result.current.state.isDefaultValue).toBe(false)
		act(() => result.current.setFieldValue('phone', ''))
		expect(result.current.state.isDefaultValue).toBe(true)
	})

	it('retains values and reports the error after a failed save, then saves the same values on retry', async () => {
		update.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data: { id: 1 } })
		const { result } = setup()
		act(() => result.current.setFieldValue('name', 'Retry me'))
		await act(() => result.current.handleSubmit())
		expect(result.current.state.errorMap.onSubmit).toBe('offline')
		expect(result.current.state.values.name).toBe('Retry me')
		await act(() => result.current.handleSubmit())
		expect(update).toHaveBeenCalledTimes(2)
		expect(result.current.state.errorMap.onSubmit).toBeUndefined()
		expect(result.current.state.isDefaultValue).toBe(true)
	})

	it('does not replace the draft or the baseline when the record refreshes', () => {
		const { result, rerender } = setup()
		act(() => result.current.setFieldValue('name', 'Draft'))
		rerender({ settings: { ...settings, name: 'Server changed' }, canWrite: true })
		expect(result.current.state.values.name).toBe('Draft')
	})

	it('refuses to send a request without update permission', async () => {
		const { result } = setup({ canWrite: false })
		act(() => result.current.setFieldValue('name', 'Nope'))
		await act(() => result.current.handleSubmit())
		expect(update).not.toHaveBeenCalled()
		expect(result.current.state.errorMap.onSubmit).toBe(COMPANY_UPDATE_DENIED)
	})
})
