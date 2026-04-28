import { formOptions } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'

import { createCallable } from 'react-call'
import { toast } from 'sonner'
import z from 'zod'

import { toastLabelMessage } from '@/lib/toast-message'
import { zPassword } from '@/lib/validation'

import { useAppForm } from '@/components/form'
import { FormDialog } from '@/components/layout/form-dialog'

import { userApi } from '../api'

const FormDto = z.object({ password: zPassword })

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
	validators: { onSubmit: FormDto },
	defaultValues: { password: '' } as FormDto,
})

interface UserPasswordDialogProps {
	id: number
	username: string
}

export const UserPasswordDialog = createCallable<UserPasswordDialogProps>((props) => {
	const { call, id, username } = props

	const updatePassword = useMutation({ mutationFn: userApi.adminPasswordReset.mutationFn })

	const form = useAppForm({
		...fopts,
		onSubmit: async ({ value }) => {
			const promise = updatePassword.mutateAsync({ body: { id, password: value.password } })

			await toast.promise(promise, toastLabelMessage('update', 'password pengguna')).unwrap()

			call.end()
		},
	})

	const disabled = updatePassword.isPending

	return (
		<form.AppForm>
			<FormDialog
				open={!call.ended}
				onOpenChange={() => call.end()}
				title={`Ubah Password @${username}`}
				description={`Masukkan password baru untuk pengguna @${username}.`}
				className="sm:max-w-md"
				onSubmit={() => form.handleSubmit()}
				footer={<form.DialogActions onCancel={call.end} disabled={disabled} />}
			>
				<div className="py-2">
					<form.AppField name="password">
						{(field) => (
							<field.InputPassword
								label="Password Baru"
								required
								placeholder="Masukkan password baru"
								disabled={disabled}
							/>
						)}
					</form.AppField>
				</div>
			</FormDialog>
		</form.AppForm>
	)
}, 200)
