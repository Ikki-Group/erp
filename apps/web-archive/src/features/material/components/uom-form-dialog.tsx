import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'

import { createCallable } from 'react-call'
import { toast } from 'sonner'
import z from 'zod'

import { toastLabelMessage } from '@/lib/toast-message'

import { useAppForm } from '@/components/form'
import { FormDialog } from '@/components/layout/form-dialog'

import { uomApi } from '../api'
import type { UomDto } from '../dto'

const FormDto = z.object({ code: z.string().min(1) })

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({ validators: { onSubmit: FormDto }, defaultValues: {} as FormDto })

function getDefaultValues(v?: UomDto): FormDto {
	return { code: v?.code ?? '' }
}

interface UomFormDialogProps {
	id?: number
}

export const UomFormDialog = createCallable<UomFormDialogProps>((props) => {
	const { call, id } = props
	const isCreate = id === undefined

	const selectedUom = useQuery({
		...uomApi.detail.query({ id: id! }),
		enabled: !!props.id,
		refetchOnMount: true,
	})

	const create = useMutation({ mutationFn: uomApi.create.mutationFn })
	const update = useMutation({ mutationFn: uomApi.update.mutationFn })

	const form = useAppForm({
		...fopts,
		defaultValues: getDefaultValues(selectedUom.data?.data),
		onSubmit: async ({ value }) => {
			value.code = value.code.toUpperCase()
			const promise = isCreate
				? create.mutateAsync({ body: { ...value } })
				: update.mutateAsync({ body: { id: id, ...value } })

			await toast
				.promise(promise, toastLabelMessage(isCreate ? 'create' : 'update', 'satuan'))
				.unwrap()

			call.end()
		},
	})

	return (
		<form.AppForm>
			<FormDialog
				open={!call.ended}
				onOpenChange={(open) => !open && call.end()}
				title={isCreate ? 'Tambah Satuan' : 'Edit Satuan'}
				onSubmit={() => form.handleSubmit()}
				footer={<form.DialogActions onCancel={call.end} />}
			>
				<form.AppField name="code">
					{(field) => <field.Input label="Satuan" required placeholder="Masukkan satuan" />}
				</form.AppField>
			</FormDialog>
		</form.AppForm>
	)
}, 200)
