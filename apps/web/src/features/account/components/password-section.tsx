import { useState } from 'react'

import { FormError } from '@/lib/form/form-error.tsx'
import { FormRoot } from '@/lib/form/form-root.tsx'

import { InlineAlert } from '@/components/shared/inline-alert.tsx'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import { usePasswordForm } from './password-form.ts'

export function passwordChangedMessage(revokedSessions: number): string {
	if (revokedSessions === 0) return 'Your password was changed. No other sessions were signed in.'
	return `Your password was changed. ${revokedSessions} other ${
		revokedSessions === 1 ? 'session was' : 'sessions were'
	} signed out.`
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
							label="Current password"
							type="password"
							autoComplete="current-password"
						/>
					)}
				</form.AppField>
				<form.AppField name="newPassword">
					{(field) => (
						<field.TextField
							label="New password"
							type="password"
							autoComplete="new-password"
							description="At least 8 characters."
						/>
					)}
				</form.AppField>
				<form.AppField name="confirmPassword">
					{(field) => (
						<field.TextField
							label="Confirm new password"
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
								Change password
							</Button>
						)}
					</form.Subscribe>
				</div>
			</FormRoot>
		</form.AppForm>
	)
}
