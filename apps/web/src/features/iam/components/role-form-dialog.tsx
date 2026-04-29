import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'

import { SparklesIcon } from 'lucide-react'
import { createCallable } from 'react-call'
import { toast } from 'sonner'
import z from 'zod'

import { toCodeCase } from '@/lib/formatter'
import { toastLabelMessage } from '@/lib/toast-message'

import { useAppForm } from '@/components/form'
import { FormDialog } from '@/components/layout/form-dialog'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { roleApi } from '../api'
import type { RoleDto } from '../dto'

const FormDto = z.object({
	name: z.string().min(2, 'Nama role minimal 2 karakter').max(100, 'Nama terlalu panjang'),
	code: z.string().min(2, 'Kode minimal 2 karakter').max(32, 'Kode maksimal 32 karakter'),
	description: z.string().nullable(),
	permissions: z.array(z.string()),
	isSystem: z.boolean(),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({ validators: { onSubmit: FormDto }, defaultValues: {} as FormDto })

function getDefaultValues(v?: RoleDto): FormDto {
	return {
		code: v?.code ?? '',
		name: v?.name ?? '',
		description: v?.description ?? '',
		permissions: v?.permissions ?? [],
		isSystem: v?.isSystem ?? false,
	}
}

interface RoleFormDialogProps {
	id?: number
}

export const RoleFormDialog = createCallable<RoleFormDialogProps>((props) => {
	const { call, id } = props
	const isCreate = id === undefined

	const selectedRole = useQuery({
		...roleApi.detail.query({ id: id! }),
		enabled: !!id,
		refetchOnMount: true,
	})

	const create = useMutation({ mutationFn: roleApi.create.mutationFn })
	const update = useMutation({ mutationFn: roleApi.update.mutationFn })

	const form = useAppForm({
		...fopts,
		defaultValues: getDefaultValues(selectedRole.data?.data),
		onSubmit: async ({ value }) => {
			const payload = {
				...value,
				description: value.description ?? null,
			}

			const promise = isCreate
				? create.mutateAsync({ body: payload })
				: update.mutateAsync({ body: { id: id, ...payload } })

			await toast
				.promise(promise, toastLabelMessage(isCreate ? 'create' : 'update', 'role'))
				.unwrap()

			call.end()
		},
	})

	const disabled = selectedRole.isLoading

	return (
		<form.AppForm>
			<FormDialog
				open={!call.ended}
				onOpenChange={(open) => !open && call.end()}
				title={isCreate ? 'Tambah Role' : 'Edit Role'}
				description="Kelola role untuk mengatur hak akses pengguna dalam sistem."
				onSubmit={() => form.handleSubmit()}
				footer={<form.DialogActions onCancel={call.end} disabled={disabled} />}
			>
				<form.AppField name="name">
					{(field) => (
						<field.Input
							label="Nama Role"
							required
							placeholder="Contoh: Administrator Utama"
							disabled={disabled}
						/>
					)}
				</form.AppField>
				<form.AppField name="code">
					{(field) => (
						<field.Base label="Kode Role" required>
							<div className="flex gap-2">
								<field.Control>
									<Input
										placeholder="Contoh: ADMIN_UTAMA"
										disabled={disabled}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										className="uppercase"
									/>
								</field.Control>
								<form.Subscribe selector={(s) => s.values.name}>
									{(name) => {
										const canGenerate = (name?.length ?? 0) > 3
										return (
											<Button
												type="button"
												variant="outline"
												size="icon-sm"
												className="shrink-0"
												onClick={() => {
													field.handleChange(toCodeCase(name || ''))
												}}
												disabled={!canGenerate || disabled}
												title="Generate kode dari nama"
											>
												<SparklesIcon />
											</Button>
										)
									}}
								</form.Subscribe>
							</div>
						</field.Base>
					)}
				</form.AppField>
				<form.AppField name="description">
					{(field) => (
						<field.Textarea
							label="Deskripsi"
							placeholder="Jelaskan tanggung jawab role ini..."
							disabled={disabled}
						/>
					)}
				</form.AppField>
			</FormDialog>
		</form.AppForm>
	)
}, 200)
