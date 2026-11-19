import { useState } from 'react'

import { FormError } from '@/lib/form/form-error.tsx'
import { FormRoot } from '@/lib/form/form-root.tsx'

import { InlineAlert } from '@/components/shared/inline-alert.tsx'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import { usePasswordForm } from './password-form.ts'

export function passwordChangedMessage(revokedSessions: number): string {
	if (revokedSessions === 0)
		return 'Kata sandi Anda telah diubah. Tidak ada sesi lain yang sedang masuk.'
	return `Kata sandi Anda telah diubah. ${revokedSessions} sesi lain telah dikeluarkan.`
}

export function PasswordSection() {
	const [revoked, setRevoked] = useState<number | null>(null)
	const form = usePasswordForm({ onChanged: setRevoked })

	return (
		<form.AppForm>
			<FormRoot form={form} className="grid gap-4">
				<form.AppField name="currentPassword">
					{(field) => (
						<field.TextField
							label="Kata sandi saat ini"
							type="password"
							autoComplete="current-password"
						/>
					)}
				</form.AppField>
				<form.AppField name="newPassword">
					{(field) => (
						<field.TextField
							label="Kata sandi baru"
							type="password"
							autoComplete="new-password"
							description="Minimal 8 karakter."
						/>
					)}
				</form.AppField>
				<form.AppField name="confirmPassword">
					{(field) => (
						<field.TextField
							label="Konfirmasi kata sandi baru"
							type="password"
							autoComplete="new-password"
						/>
					)}
				</form.AppField>
				<FormError />
				{revoked !== null && (
					<InlineAlert variant="success">{passwordChangedMessage(revoked)}</InlineAlert>
				)}
				<div className="flex justify-end">
					<form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit] as const}>
						{([isSubmitting, canSubmit]) => (
							<Button
								type="submit"
								disabled={isSubmitting || !canSubmit}
								onClick={() => setRevoked(null)}
							>
								{isSubmitting && <Spinner className="mr-1.5 size-3.5" />}
								Ubah kata sandi
							</Button>
						)}
					</form.Subscribe>
				</div>
			</FormRoot>
		</form.AppForm>
	)
}
