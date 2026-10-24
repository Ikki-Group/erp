import { z } from 'zod'

import { FormDialogFooter, FormRoot, useEntityEditor } from '@/lib/form/index.ts'

import { formDialog } from '@/components/shared/form-dialog.tsx'

import { userResource } from '../api.ts'
import { UserResetPasswordDto } from '../dto/index.ts'

const ResetPasswordSchema = z.object({
	password: z.string().min(8, 'Password must be at least 8 characters').max(100),
})

interface ResetPasswordFormBodyProps {
	userId: number
	close: (result?: boolean) => void
}

function ResetPasswordFormBody({ userId, close }: ResetPasswordFormBodyProps) {
	const form = useEntityEditor({
		defaultValues: { password: '' },
		schema: ResetPasswordSchema,
		mutation: userResource.resetPassword.mutationOptions(),
		toPayload: (values) => UserResetPasswordDto.parse({ id: userId, password: values.password }),
		successMessage: 'Password reset successfully.',
		onSaved: () => close(true),
	})

	return (
		<form.AppForm>
			<FormRoot form={form} className="grid gap-4">
				<form.AppField name="password">
					{(field) => (
						<field.TextField
							label="New password"
							type="password"
							autoComplete="new-password"
							placeholder="Minimum 8 characters"
							autoFocus
						/>
					)}
				</form.AppField>
				<form.FormError />
				<FormDialogFooter onCancel={() => close(false)} submitLabel="Reset password" />
			</FormRoot>
		</form.AppForm>
	)
}

/** Opens a focused reset flow; owns success feedback and never changes the profile form. */
export async function resetUserPassword(user: { id: number; name: string }): Promise<boolean> {
	return formDialog({
		title: 'Reset Password',
		description: `Set a new password for ${user.name}. They will be signed out of all active sessions.`,
		// oxlint-disable-next-line react/no-unstable-nested-components
		content: ({ close }) => <ResetPasswordFormBody userId={user.id} close={close} />,
	})
}
