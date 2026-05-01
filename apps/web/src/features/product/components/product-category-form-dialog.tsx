import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'

import { createCallable } from 'react-call'
import { toast } from 'sonner'
import z from 'zod'

import { toastLabelMessage } from '@/lib/toast-message'

import { useAppForm } from '@/components/form'
import { FormDialog } from '@/components/layout/form-dialog'

import { productCategoryApi } from '../api'
import type { ProductCategoryDto } from '../dto'

const FormDto = z.object({ name: z.string().min(1), description: z.string() })

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({ validators: { onSubmit: FormDto }, defaultValues: {} as FormDto })

function getDefaultValues(v?: ProductCategoryDto): FormDto {
	return { name: v?.name ?? '', description: v?.description ?? '' }
}

interface ProductCategoryFormDialogProps {
	id?: number
}

export const ProductCategoryFormDialog = createCallable<ProductCategoryFormDialogProps>((props) => {
	const { call, id } = props
	const isCreate = id === undefined

	const selectedCategory = useQuery({
		...productCategoryApi.detail.query({ id: id! }),
		enabled: !!props.id,
		refetchOnMount: true,
	})

	const create = useMutation({ mutationFn: productCategoryApi.create.mutationFn })
	const update = useMutation({ mutationFn: productCategoryApi.update.mutationFn })

	const form = useAppForm({
		...fopts,
		defaultValues: getDefaultValues(selectedCategory.data?.data),
		onSubmit: async ({ value }) => {
			const promise = isCreate
				? create.mutateAsync({ body: { ...value, parentId: null } })
				: update.mutateAsync({ body: { id, ...value, parentId: null } })

			await toast
				.promise(promise, toastLabelMessage(isCreate ? 'create' : 'update', 'kategori produk'))
				.unwrap()

			call.end()
		},
	})

	const disabled = selectedCategory.isLoading

	return (
		<form.AppForm>
			<FormDialog
				open={!call.ended}
				onOpenChange={(open) => !open && call.end()}
				title={isCreate ? 'Tambah Kategori' : 'Edit Kategori'}
				onSubmit={() => form.handleSubmit()}
				footer={<form.DialogActions onCancel={call.end} disabled={disabled} />}
			>
				<form.AppField name="name">
					{(field) => (
						<field.Input
							label="Kategori"
							required
							placeholder="Masukkan nama kategori"
							disabled={disabled}
						/>
					)}
				</form.AppField>
				<form.AppField name="description">
					{(field) => (
						<field.Textarea
							label="Deskripsi"
							placeholder="Masukkan deskripsi"
							disabled={disabled}
						/>
					)}
				</form.AppField>
			</FormDialog>
		</form.AppForm>
	)
}, 200)
