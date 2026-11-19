import { z } from 'zod'

import { isApiError } from '@/lib/api/errors.ts'
import { useAppForm } from '@/lib/form/app-form.ts'
import type { EntityForm } from '@/lib/form/use-entity-form.ts'

import { toast } from '@/components/ui/toast'

import { passwordChange } from '../api.ts'

export interface PasswordFormValues {
	currentPassword: string
	newPassword: string
	confirmPassword: string
}

export const EMPTY_PASSWORD_VALUES: PasswordFormValues = {
	currentPassword: '',
	newPassword: '',
	confirmPassword: '',
}

export const PasswordFormSchema = z
	.object({
		currentPassword: z.string().min(1, 'Masukkan kata sandi saat ini'),
		newPassword: z
			.string()
			.min(8, 'Kata sandi minimal 8 karakter')
			.max(100, 'Kata sandi maksimal 100 karakter'),
		confirmPassword: z.string(),
	})
	.refine((values) => values.newPassword === values.confirmPassword, {
		path: ['confirmPassword'],
		message: 'Kata sandi tidak cocok',
	})

export interface PasswordFieldError {
	field: 'currentPassword' | 'newPassword'
	message: string
}

/** Server rejections that belong to a single field; anything else stays a form-level error. */
export function mapPasswordError(error: unknown): PasswordFieldError | undefined {
	if (!isApiError(error)) return undefined
	if (error.code === 'INVALID_CURRENT_PASSWORD') {
		return { field: 'currentPassword', message: 'Kata sandi saat ini salah' }
	}
	if (error.code === 'PASSWORD_UNCHANGED') {
		return { field: 'newPassword', message: 'Kata sandi baru harus berbeda dari yang sekarang' }
	}
	return undefined
}

export type PasswordForm = EntityForm<PasswordFormValues>

export function usePasswordForm({
	onChanged,
}: {
	/** Called after the password was changed, with how many other sessions were signed out. */
	onChanged: (revokedSessions: number) => void
}): PasswordForm {
	return useAppForm({
		defaultValues: EMPTY_PASSWORD_VALUES,
		validators: { onChange: PasswordFormSchema, onSubmit: PasswordFormSchema } as never,
		onSubmit: async ({ value, formApi }) => {
			try {
				const result = await passwordChange.fetch({
					currentPassword: value.currentPassword,
					newPassword: value.newPassword,
				})
				toast.add({ title: 'Kata sandi berhasil diubah.', type: 'success' })
				formApi.reset(EMPTY_PASSWORD_VALUES)
				onChanged(result.data.revokedSessions)
			} catch (error) {
				const mapped = mapPasswordError(error)
				if (mapped) {
					formApi.setErrorMap({ onSubmit: { fields: { [mapped.field]: mapped.message } } })
					return
				}
				const message = isApiError(error)
					? error.friendlyMessage
					: error instanceof Error
						? error.message
						: 'Terjadi kesalahan tak terduga.'
				formApi.setErrorMap({ onSubmit: { form: message, fields: {} } })
			}
		},
	}) as PasswordForm
}
