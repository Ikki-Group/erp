import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'

import { createCallable } from 'react-call'
import { toast } from 'sonner'
import z from 'zod'

import { toastLabelMessage } from '@/lib/toast-message'

import { useAppForm } from '@/components/form'
import { FormDialog } from '@/components/layout/form-dialog'

import { supplierApi } from '../api'
import type { SupplierDto } from '../dto'

const FormDto = z.object({
	code: z.string().min(1, 'Kode wajib diisi'),
	name: z.string().min(1, 'Nama wajib diisi'),
	email: z.string().email('Email tidak valid').optional().nullable(),
	phone: z.string().optional().nullable(),
	address: z.string().optional().nullable(),
	taxId: z.string().optional().nullable(),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({ validators: { onSubmit: FormDto }, defaultValues: {} as FormDto })

function getDefaultValues(v?: SupplierDto): FormDto {
	return {
		code: v?.code ?? '',
		name: v?.name ?? '',
		email: v?.email ?? null,
		phone: v?.phone ?? null,
		address: v?.address ?? null,
		taxId: v?.taxId ?? null,
	}
}

interface SupplierFormDialogProps {
	id?: number
}

export const SupplierFormDialog = createCallable<SupplierFormDialogProps, void>(
	(props) => {
		const { call, id } = props
		const isCreate = id === undefined

		const selectedSupplier = useQuery({
			...supplierApi.detail.query({ id: id! }),
			enabled: !!props.id,
			refetchOnMount: true,
		})

		const create = useMutation({ mutationFn: supplierApi.create.mutationFn })
		const update = useMutation({ mutationFn: supplierApi.update.mutationFn })

		const form = useAppForm({
			...fopts,
			defaultValues: getDefaultValues(selectedSupplier.data?.data),
			onSubmit: async ({ value }) => {
				const promise = isCreate
					? create.mutateAsync({ body: value })
					: update.mutateAsync({ body: { id: id!, ...value } })

				await toast
					.promise(
						promise,
						toastLabelMessage(isCreate ? 'create' : 'update', 'supplier'),
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
					title={isCreate ? 'Tambah Supplier' : 'Edit Supplier'}
					onSubmit={() => form.handleSubmit()}
					footer={<form.DialogActions onCancel={call.end} />}
				>
					<div className="grid grid-cols-2 gap-4">
						<form.AppField name="code">
							{(field) => (
								<field.Input label="Kode Supplier" required placeholder="SUP-001" />
							)}
						</form.AppField>
						<form.AppField name="name">
							{(field) => (
								<field.Input label="Nama Supplier" required placeholder="PT. Contoh Supplier" />
							)}
						</form.AppField>
					</div>
					<form.AppField name="email">
						{(field) => <field.Input label="Email" type="email" placeholder="email@supplier.com" />}
					</form.AppField>
					<div className="grid grid-cols-2 gap-4">
						<form.AppField name="phone">
							{(field) => <field.Input label="Telepon" placeholder="0812-3456-7890" />}
						</form.AppField>
						<form.AppField name="taxId">
							{(field) => <field.Input label="NPWP / Tax ID" placeholder="00.000.000.0-000.000" />}
						</form.AppField>
					</div>
					<form.AppField name="address">
						{(field) => <field.Textarea label="Alamat" placeholder="Jl. Contoh No. 123, Jakarta" />}
					</form.AppField>
				</FormDialog>
			</form.AppForm>
		)
	},
	200,
)
