import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'

import { createCallable } from 'react-call'
import { toast } from 'sonner'
import z from 'zod'

import { toastLabelMessage } from '@/lib/toast-message'

import { useAppForm } from '@/components/form'

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

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
				? // TODO
					// @ts-expect-error
					create.mutateAsync({ body: { ...value } })
				: // @ts-expect-error
					update.mutateAsync({ body: { id, ...value } })

			await toast
				.promise(promise, toastLabelMessage(isCreate ? 'create' : 'update', 'kategori produk'))
				.unwrap()

			call.end()
		},
	})

	const disabled = selectedCategory.isLoading

	return (
		<form.AppForm>
			<Dialog open={!call.ended} onOpenChange={() => call.end()}>
				<DialogContent>
					<DialogHeader className="border-b pb-4">
						<DialogTitle>Kategori Produk</DialogTitle>
					</DialogHeader>
					<form.AppField name="name">
						{(field) => (
							<field.Base label="Kategori" required>
								<field.Input placeholder="Masukkan nama kategori" disabled={disabled} required />
							</field.Base>
						)}
					</form.AppField>
					<form.AppField name="description">
						{(field) => (
							<field.Base label="Deskripsi">
								<field.Textarea placeholder="Masukkan Deskripsi" disabled={disabled} />
							</field.Base>
						)}
					</form.AppField>
					<DialogFooter>
						<form.DialogActions onCancel={call.end} />
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</form.AppForm>
	)
}, 200)
