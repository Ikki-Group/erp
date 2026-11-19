// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/lib/api/errors.ts'

import { mapPasswordError, PasswordFormSchema } from './password-form.ts'
import { PasswordSection } from './password-section.tsx'

// A plain function, not vi.fn: vitest tracks rejected mock results and reports them as unhandled.
const api = vi.hoisted(() => ({
	calls: [] as unknown[],
	respond: (_body: unknown): Promise<{ data: { revokedSessions: number } }> =>
		Promise.resolve({ data: { revokedSessions: 0 } }),
}))
vi.mock('../api.ts', () => ({
	passwordChange: {
		fetch: (body: unknown) => {
			api.calls.push(body)
			return api.respond(body)
		},
	},
}))
vi.mock('@/components/ui/toast', () => ({ toast: { add: vi.fn<() => void>() } }))

beforeEach(() => {
	api.calls.length = 0
})
afterEach(cleanup)

const apiError = (code: string) => new ApiError('bad', { status: 400, code })

describe('PasswordFormSchema', () => {
	const valid = { currentPassword: 'old', newPassword: 'longenough', confirmPassword: 'longenough' }

	it('requires 8+ characters and a matching confirmation', () => {
		expect(PasswordFormSchema.safeParse(valid).success).toBe(true)
		expect(
			PasswordFormSchema.safeParse({ ...valid, newPassword: 'short', confirmPassword: 'short' })
				.success,
		).toBe(false)
		const mismatch = PasswordFormSchema.safeParse({ ...valid, confirmPassword: 'different1' })
		expect(mismatch.error?.issues[0]?.path).toEqual(['confirmPassword'])
	})
})

describe('mapPasswordError', () => {
	it('maps known codes to their field and leaves others alone', () => {
		expect(mapPasswordError(apiError('INVALID_CURRENT_PASSWORD'))?.field).toBe('currentPassword')
		expect(mapPasswordError(apiError('PASSWORD_UNCHANGED'))?.field).toBe('newPassword')
		expect(mapPasswordError(apiError('OTHER'))).toBeUndefined()
		expect(mapPasswordError(new Error('x'))).toBeUndefined()
	})
})

describe('PasswordSection', () => {
	function fillAndSubmit() {
		render(<PasswordSection />)
		fireEvent.change(screen.getByLabelText('Kata sandi saat ini'), {
			target: { value: 'old-password' },
		})
		fireEvent.change(screen.getByLabelText('Kata sandi baru'), {
			target: { value: 'new-password' },
		})
		fireEvent.change(screen.getByLabelText('Konfirmasi kata sandi baru'), {
			target: { value: 'new-password' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Ubah kata sandi' }))
	}

	it('shows a wrong current password on its field and retires it on edit', async () => {
		api.respond = async () => {
			throw apiError('INVALID_CURRENT_PASSWORD')
		}
		fillAndSubmit()
		await screen.findByText('Kata sandi saat ini salah')
		expect(screen.queryByRole('alert')).toBeNull()

		fireEvent.change(screen.getByLabelText('Kata sandi saat ini'), {
			target: { value: 'other-pass' },
		})
		await waitFor(() => expect(screen.queryByText('Kata sandi saat ini salah')).toBeNull())
	})

	it('maps PASSWORD_UNCHANGED to the new password field', async () => {
		api.respond = async () => {
			throw apiError('PASSWORD_UNCHANGED')
		}
		fillAndSubmit()
		expect(await screen.findByText('Kata sandi baru harus berbeda dari yang sekarang')).toBeTruthy()
	})

	it('clears the fields and reports how many other sessions were signed out', async () => {
		api.respond = () => Promise.resolve({ data: { revokedSessions: 2 } })
		fillAndSubmit()
		await screen.findByText(/2 sesi lain telah dikeluarkan/u)
		expect(api.calls).toEqual([{ currentPassword: 'old-password', newPassword: 'new-password' }])
		expect((screen.getByLabelText('Kata sandi saat ini') as HTMLInputElement).value).toBe('')
		expect((screen.getByLabelText('Kata sandi baru') as HTMLInputElement).value).toBe('')
	})

	it('surfaces other failures as a form-level error', async () => {
		api.respond = async () => {
			throw new ApiError('boom', { status: 500 })
		}
		fillAndSubmit()
		expect((await screen.findByRole('alert')).textContent).toBeTruthy()
	})
})
