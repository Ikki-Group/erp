import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'

import { createCallable } from 'react-call'
import { toast } from 'sonner'
import z from 'zod'

import { toastLabelMessage } from '@/lib/toast-message'

import { useAppForm } from '@/components/form'
import { FormDialog } from '@/components/layout/form-dialog'

import { customerApi } from '../api'
import type { CustomerDto } from '../dto'

const FormDto = z.object({
	code: z.string().min(3).max(20),
	name: z.string().min(2).max(100),
	email: z.string().email().optional().or(z.literal('')),
	phone: z.string().min(10).max(20).optional().or(z.literal('')),
	address: z.string().min(5).max(255).optional().or(z.literal('')),
	taxId: z.string().min(10).max(30).optional().or(z.literal('')),
	dateOfBirth: z.string().optional().or(z.literal('')),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({ validators: { onSubmit: FormDto }, defaultValues: {} as FormDto })

function getDefaultValues(v?: CustomerDto): FormDto {
	return {
		code: v?.code ?? '',
		name: v?.name ?? '',
		email: v?.email ?? '',
		phone: v?.phone ?? '',
		address: v?.address ?? '',
		taxId: v?.taxId ?? '',
		dateOfBirth: v?.dateOfBirth ? new Date(v.dateOfBirth).toISOString().split('T')[0] : '',
	}
}

interface CustomerFormDialogProps {
	id?: number
}

export const CustomerFormDialog = createCallable<CustomerFormDialogProps>((props) => {
	const { call, id } = props
	const isCreate = id === undefined

	const selectedCustomer = useQuery({
		...customerApi.detail.query({ id: id! }),
		enabled: !!props.id,
		refetchOnMount: true,
	})

	const create = useMutation({ mutationFn: customerApi.create.mutationFn })
	const update = useMutation({ mutationFn: customerApi.update.mutationFn })

	const form = useAppForm({
		...fopts,
		defaultValues: getDefaultValues(selectedCustomer.data?.data),
		onSubmit: async ({ value }) => {
			const payload = {
				...value,
				dateOfBirth: value.dateOfBirth ? new Date(value.dateOfBirth) : undefined,
			}

			const promise = isCreate
				? create.mutateAsync({ body: payload })
				: update.mutateAsync({ body: { id, ...payload } })

			await toast
				.promise(
					promise,
					toastLabelMessage(isCreate ? 'create' : 'update', 'pelanggan'),
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
				title={isCreate ? 'Tambah Pelanggan' : 'Edit Pelanggan'}
				onSubmit={() => form.handleSubmit()}
				footer={<form.DialogActions onCancel={call.end} />}
			>
				<div className="grid grid-cols-2 gap-4">
					<form.AppField name="code">
						{(field) => (
							<field.Input
								label="Kode Pelanggan"
								required
								placeholder="CUST-001"
								uppercase
							/>
						)}
					</form.AppField>
					<form.AppField name="name">
						{(field) => (
							<field.Input label="Nama" required placeholder="Nama pelanggan" />
						)}
					</form.AppField>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<form.AppField name="email">
						{(field) => (
							<field.Input
								label="Email"
								type="email"
								placeholder="email@example.com"
							/>
						)}
					</form.AppField>
					<form.AppField name="phone">
						{(field) => (
							<field.Input label="Telepon" placeholder="081234567890" />
						)}
					</form.AppField>
				</div>
				<form.AppField name="address">
					{(field) => <field.Textarea label="Alamat" placeholder="Alamat lengkap" />}
				</form.AppField>
				<div className="grid grid-cols-2 gap-4">
					<form.AppField name="taxId">
						{(field) => (
							<field.Input label="NPWP" placeholder="00.000.000.0-000.000" />
						)}
					</form.AppField>
					<form.AppField name="dateOfBirth">
						{(field) => <field.Input label="Tanggal Lahir" type="date" />}
					</form.AppField>
				</div>
			</FormDialog>
		</form.AppForm>
	)
}, 200)
