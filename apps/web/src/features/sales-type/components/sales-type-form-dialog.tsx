import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'

import { Wand2Icon } from 'lucide-react'
import { createCallable } from 'react-call'
import { toast } from 'sonner'
import z from 'zod'

import { toCodeCase } from '@/lib/formatter'
import { toastLabelMessage } from '@/lib/toast-message'

import { useAppForm } from '@/components/form'
import { FormDialog } from '@/components/layout/form-dialog'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { salesTypeApi } from '../api/sales-type.api'
import type { SalesTypeDto } from '../dto/sales-type.dto'

const FormDto = z.object({
	code: z.string().min(1),
	name: z.string().min(1),
	isSystem: z.boolean(),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
	validators: { onSubmit: FormDto },
	defaultValues: {} as FormDto,
})

function getDefaultValues(v?: SalesTypeDto): FormDto {
	return { code: v?.code ?? '', name: v?.name ?? '', isSystem: v?.isSystem ?? false }
}

interface SalesTypeFormDialogProps {
	id?: number
}

export const SalesTypeFormDialog = createCallable<SalesTypeFormDialogProps>((props) => {
	const { call, id } = props
	const isCreate = id === undefined

	const selected = useQuery({
		...salesTypeApi.detail.query({ id: id! }),
		enabled: !!props.id,
		refetchOnMount: true,
	})

	const create = useMutation({ mutationFn: salesTypeApi.create.mutationFn })
	const update = useMutation({ mutationFn: salesTypeApi.update.mutationFn })

	const form = useAppForm({
		...fopts,
		defaultValues: getDefaultValues(selected.data?.data),
		onSubmit: async ({ value }) => {
			const promise = isCreate
				? create.mutateAsync({ body: value })
				: update.mutateAsync({ body: { id, ...value } })

			await toast
				.promise(promise, toastLabelMessage(isCreate ? 'create' : 'update', 'tipe penjualan'))
				.unwrap()

			call.end()
		},
	})

	const disabled = selected.isLoading

	return (
		<form.AppForm>
			<FormDialog
				open={!call.ended}
				onOpenChange={(open) => !open && call.end()}
				title={isCreate ? 'Tambah Tipe Penjualan' : 'Edit Tipe Penjualan'}
				onSubmit={() => form.handleSubmit()}
				footer={<form.DialogActions onCancel={call.end} disabled={disabled} />}
			>
				<form.AppField name="code">
					{(field) => (
						<field.Base label="Kode Tipe" required>
							<div className="flex items-center gap-2">
								<field.Control>
									<Input
										placeholder="Masukkan kode tipe penjualan"
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
												<Wand2Icon />
											</Button>
										)
									}}
								</form.Subscribe>
							</div>
						</field.Base>
					)}
				</form.AppField>
				<form.AppField name="name">
					{(field) => (
						<field.Input
							label="Nama Tipe"
							required
							placeholder="Masukkan nama tipe penjualan"
							disabled={disabled}
						/>
					)}
				</form.AppField>
			</FormDialog>
		</form.AppForm>
	)
}, 200)
