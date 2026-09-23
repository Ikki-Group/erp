import { useMutation } from '@tanstack/react-query'

import { z } from 'zod'

import { FormDialogFooter, useEntityForm } from '@/lib/form/index.ts'

import { formDialog } from '@/components/shared/form-dialog.tsx'

import { userResource } from '../api.ts'

const ResetPasswordSchema = z.object({
	password: z.string().min(8, 'Password must be at least 8 characters').max(100),
})

interface ResetPasswordFormBodyProps {
	userId: number
	close: (result?: boolean) => void
}

function ResetPasswordFormBody({ userId, close }: ResetPasswordFormBodyProps) {
	const resetMut = useMutation(userResource.resetPassword.mutationOptions())
	const form = useEntityForm({
		defaultValues: { password: '' },
		schema: ResetPasswordSchema,
		onSubmit: async (values) => {
			await resetMut.mutateAsync({ id: userId, password: values.password })
			close(true)
		},
	})

	return (
		<form.AppForm>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					void form.handleSubmit()
				}}
				className="grid gap-4"
			>
				<form.AppField name="password">
					{(field) => (
						<field.TextField
							label="New password"
							type="password"
							placeholder="Minimum 8 characters"
							autoFocus
						/>
					)}
				</form.AppField>
				<form.FormError />
				<FormDialogFooter onCancel={() => close(false)} submitLabel="Reset password" />
			</form>
		</form.AppForm>
	)
}

/**
 * Opens the reset-password dialog for the given user. Resolves `true` if the
 * password was reset, `false` if cancelled — the caller shows its own
 * success toast, matching the app's `formDialog` convention. Resetting
 * signs the user out of every active session (see `handleResetPassword`).
 */
export async function resetUserPassword(user: { id: number; name: string }): Promise<boolean> {
	return formDialog({
		title: 'Reset Password',
		description: `Set a new password for ${user.name}. They will be signed out of all active sessions.`,
		// oxlint-disable-next-line react/no-unstable-nested-components
		content: ({ close }) => <ResetPasswordFormBody userId={user.id} close={close} />,
	})
}
