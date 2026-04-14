import { formOptions } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createCallable } from 'react-call'
import { toast } from 'sonner'
import z from 'zod'

import { useAppForm } from '@/components/form'
import { FormDialog } from '@/components/layout/form-dialog'
import { toastLabelMessage } from '@/lib/toast-message'

import { userApi } from '../api'

const FormDto = z.object({ oldPassword: z.string().min(8), newPassword: z.string().min(8) })

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
	validators: { onSubmit: FormDto },
	defaultValues: { oldPassword: '', newPassword: '' } as FormDto,
})

export const UserProfilePasswordDialog = createCallable((props) => {
	const { call } = props

	const changePassword = useMutation({ mutationFn: userApi.changePassword.mutationFn })

	const form = useAppForm({
		...fopts,
		onSubmit: async ({ value }) => {
			const promise = changePassword.mutateAsync({
				body: { oldPassword: value.oldPassword, newPassword: value.newPassword },
			})

			await toast.promise(promise, toastLabelMessage('update', 'password')).unwrap()

			call.end()
		},
	})

	const disabled = changePassword.isPending

	return (
		<form.AppForm>
			<FormDialog
				open={!call.ended}
				onOpenChange={() => call.end()}
				title="Ubah Password"
				description="Gunakan password yang kuat dengan perpaduan huruf dan angka untuk keamanan akun Anda."
				className="sm:max-w-md"
				footer={<form.DialogActions onCancel={call.end} disabled={disabled} />}
			>
				<div className="flex flex-col gap-4 py-2">
					<form.AppField name="oldPassword">
						{(field) => (
							<field.InputPassword
								label="Password Saat Ini"
								required
								placeholder="Masukkan password saat ini"
								disabled={disabled}
							/>
						)}
					</form.AppField>
					<form.AppField name="newPassword">
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
})
