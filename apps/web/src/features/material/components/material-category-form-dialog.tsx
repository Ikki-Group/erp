import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'

import { createCallable } from 'react-call'
import { toast } from 'sonner'
import z from 'zod'

import { toastLabelMessage } from '@/lib/toast-message'

import { useAppForm } from '@/components/form'
import { FormDialog } from '@/components/layout/form-dialog'

import { materialCategoryApi } from '../api'
import type { MaterialCategoryDto } from '../dto'

const FormDto = z.object({ name: z.string().min(1), description: z.string() })

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({ validators: { onSubmit: FormDto }, defaultValues: {} as FormDto })

function getDefaultValues(v?: MaterialCategoryDto): FormDto {
	return { name: v?.name ?? '', description: v?.description ?? '' }
}

interface MaterialCategoryFormDialogProps {
	id?: number
}

export const MaterialCategoryFormDialog = createCallable<MaterialCategoryFormDialogProps>(
	(props) => {
		const { call, id } = props
		const isCreate = id === undefined

		const selectedCategory = useQuery({
			...materialCategoryApi.detail.query({ id: id! }),
			enabled: !!props.id,
			refetchOnMount: true,
		})

		const create = useMutation({ mutationFn: materialCategoryApi.create.mutationFn })
		const update = useMutation({ mutationFn: materialCategoryApi.update.mutationFn })

		const form = useAppForm({
			...fopts,
			defaultValues: getDefaultValues(selectedCategory.data?.data),
			onSubmit: async ({ value }) => {
				const promise = isCreate
					? create.mutateAsync({ body: { ...value, parentId: null } })
					: update.mutateAsync({ body: { id, ...value, parentId: null } })

				await toast
					.promise(
						promise,
						toastLabelMessage(isCreate ? 'create' : 'update', 'kategori bahan baku'),
					)
					.unwrap()

				call.end()
			},
		})

		return (
			<form.AppForm>
				<FormDialog
					open={!call.ended}
					onOpenChange={(open) => !open && call.end()}
					title={isCreate ? 'Tambah Kategori' : 'Edit Kategori'}
					onSubmit={() => form.handleSubmit()}
					footer={<form.DialogActions onCancel={call.end} />}
				>
					<form.AppField name="name">
						{(field) => (
							<field.Input label="Kategori" required placeholder="Masukkan nama kategori" />
						)}
					</form.AppField>
					<form.AppField name="description">
						{(field) => <field.Textarea label="Deskripsi" placeholder="Masukkan deskripsi" />}
					</form.AppField>
				</FormDialog>
			</form.AppForm>
		)
	},
	200,
)
